// lib/algorithm/tour-planning.ts
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/profile";
import type { Abwesenheit } from "@/lib/types/abwesenheit";
import type { Ticket } from "@/lib/types/ticket";
import type { TourDraftResult } from "@/lib/types/tour";
import { buildCapacityMap } from "@/lib/algorithm/capacity";
import { buildTravelMatrix, normalizeCoord } from "@/lib/algorithm/travel-matrix";
import { kMeansPlusPlus, assignClustersToDays, type GeoPoint } from "@/lib/algorithm/clustering";
import { nearestNeighborOrder, calcArrivalTimes, minsToTimeString } from "@/lib/algorithm/routing";
import { sortTicketsByPriority, resolveTicketTechnician } from "@/lib/algorithm/ticket-assignment";
import { findBestAlternativeTechnician, type TechDaySlot } from "@/lib/algorithm/absence-cover";

const DEFAULT_TICKET_DURATION_MINS = 60;

function getDatesInRange(von: string, bis: string): string[] {
  const dates: string[] = [];
  const cur = new Date(von + "T12:00:00Z");
  const end = new Date(bis + "T12:00:00Z");
  while (cur <= end) {
    const d = new Date(cur);
    dates.push(d.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

export async function runTourPlanning(
  tourId: number,
  von: string,
  bis: string,
  mapsApiKey: string,
  timeoutMs = 55000
): Promise<TourDraftResult> {
  const deadline = Date.now() + timeoutMs;
  const supabase = await createClient();
  const dates = getDatesInRange(von, bis).filter(d => {
    const dow = new Date(d + "T12:00:00Z").getUTCDay();
    return dow >= 1 && dow <= 5; // Mon–Fri only
  });
  const warnings: string[] = [];
  let partial = false;

  // --- Step 1: Data Fetch ---
  const [wartungenRes, ticketsRes, profilesRes, absenceRes] = await Promise.all([
    supabase.from("wartungsvertraege")
      .select("id, anlage_id, dauer_wartung_minuten, anlagen(id, breitengrad, laengengrad, techniker_id, anlagen_nr)")
      .gte("datum_naechste_wartung", von)
      .lte("datum_naechste_wartung", bis),
    supabase.from("tickets")
      .select("*")
      .eq("status", "offen"),
    supabase.from("profiles")
      .select("*")
      .eq("aktiv", true),
    supabase.from("user_abwesenheiten")
      .select("*")
      .lte("von", bis)
      .gte("bis", von),
  ]);

  const allProfiles: Profile[] = (profilesRes.data ?? []) as Profile[];
  const allAbsences: Abwesenheit[] = (absenceRes.data ?? []) as Abwesenheit[];
  const openTickets: Ticket[] = (ticketsRes.data ?? []) as Ticket[];

  // Group plants by technician
  type PlantRow = { id: number; breitengrad: number | null; laengengrad: number | null; techniker_id: string | null; anlagen_nr: string | null };
  const plantsByTech: Record<string, GeoPoint[]> = {};
  const anlageToTech: Record<number, string> = {};
  // Keep a coord cache for redistribution centroid calculations
  const anlageCoordsMap: Record<number, { lat: number; lng: number }> = {};

  for (const wv of wartungenRes.data ?? []) {
    const anlage = wv.anlagen as unknown as PlantRow | null;
    if (!anlage) continue;
    if (!anlage.breitengrad || !anlage.laengengrad) {
      warnings.push(`Anlage ${anlage.anlagen_nr ?? wv.anlage_id} hat keine GPS-Koordinaten und wurde übersprungen.`);
      continue;
    }
    const techId = anlage.techniker_id ?? "unassigned";
    if (!plantsByTech[techId]) plantsByTech[techId] = [];
    plantsByTech[techId].push({
      id: String(wv.anlage_id),
      lat: normalizeCoord(anlage.breitengrad),
      lng: normalizeCoord(anlage.laengengrad),
      dauer_minuten: wv.dauer_wartung_minuten ?? 60,
    });
    if (anlage.techniker_id) anlageToTech[wv.anlage_id] = anlage.techniker_id;
    anlageCoordsMap[wv.anlage_id] = { lat: normalizeCoord(anlage.breitengrad), lng: normalizeCoord(anlage.laengengrad) };
  }

  if (plantsByTech["unassigned"]?.length) {
    warnings.push(`${plantsByTech["unassigned"].length} Anlage(n) ohne Techniker wurden übersprungen.`);
  }

  // --- Step 2: Capacity Map ---
  const capacity = buildCapacityMap(allProfiles, allAbsences, dates);

  // --- Steps 3–5: Per-technician routing ---
  const allStopRows: Array<{
    tour_id: number; techniker_id: string; datum: string; position: number;
    item_type: string; anlage_id?: number; ticket_id?: number;
    geplante_startzeit: string; fahrtzeit_minuten: number; dauer_minuten: number;
    original_techniker_id?: string;
  }> = [];

  const unscheduledByTech: Record<string, GeoPoint[]> = {};

  for (const profile of allProfiles) {
    if (Date.now() > deadline) { partial = true; break; }
    const plants = plantsByTech[profile.id] ?? [];
    if (plants.length === 0) continue;
    const startPoint = profile.start_lat && profile.start_lng
      ? { lat: profile.start_lat, lng: profile.start_lng }
      : { lat: plants[0]!.lat, lng: plants[0]!.lng };

    const availableDates = dates.filter(d => (capacity[profile.id]?.[d]?.available_mins ?? 0) > 0);
    if (availableDates.length === 0) {
      // Fully absent — queue for redistribution
      unscheduledByTech[profile.id] = plants;
      continue;
    }

    // Step 3: Travel matrix
    const allPoints = [startPoint, ...plants.map(p => ({ lat: p.lat, lng: p.lng }))];
    const matrix = await buildTravelMatrix(allPoints, mapsApiKey);
    if (Date.now() > deadline) { partial = true; break; }

    // Step 4: Clustering
    let dayAssignment: Record<string, GeoPoint[]>;
    if (availableDates.length <= 2) {
      // Greedy fill
      dayAssignment = {};
      let di = 0;
      for (const p of plants) {
        const date = availableDates[di % availableDates.length]!;
        if (!dayAssignment[date]) dayAssignment[date] = [];
        dayAssignment[date].push(p);
        di++;
      }
    } else {
      const clusters = kMeansPlusPlus(plants, availableDates.length, tourId);
      dayAssignment = assignClustersToDays(clusters, startPoint, availableDates);
    }

    // Step 5: Route ordering per day
    for (const [datum, dayPlants] of Object.entries(dayAssignment)) {
      const capInfo = capacity[profile.id]?.[datum];
      if (!capInfo || capInfo.available_mins === 0) continue;
      const ordered = nearestNeighborOrder(dayPlants, startPoint, matrix);
      const scheduled = calcArrivalTimes(ordered, startPoint, capInfo.route_start_mins, matrix);
      for (const stop of scheduled) {
        allStopRows.push({
          tour_id: tourId,
          techniker_id: profile.id,
          datum,
          position: stop.position,
          item_type: "wartung",
          anlage_id: parseInt(stop.id),
          geplante_startzeit: minsToTimeString(stop.geplante_startzeit_mins),
          fahrtzeit_minuten: stop.fahrtzeit_minuten,
          dauer_minuten: stop.dauer_minuten,
        });
      }
    }
  }

  // --- Step 6: Absence Redistribution ---
  for (const [absentTechId, plants] of Object.entries(unscheduledByTech)) {
    for (const plant of plants) {
      // Build current available slots from capacity map
      const availableSlots: TechDaySlot[] = [];
      for (const profile of allProfiles) {
        for (const datum of dates) {
          const cap = capacity[profile.id]?.[datum];
          if (!cap || cap.available_mins === 0) continue;
          // Use average lat/lng of day's already-scheduled plants as centroid approximation
          const dayStops = allStopRows.filter(s => s.techniker_id === profile.id && s.datum === datum && s.anlage_id != null);
          const centroid = dayStops.length > 0
            ? {
                lat: dayStops.reduce((sum, s) => sum + (anlageCoordsMap[s.anlage_id!]?.lat ?? plant.lat), 0) / dayStops.length,
                lng: dayStops.reduce((sum, s) => sum + (anlageCoordsMap[s.anlage_id!]?.lng ?? plant.lng), 0) / dayStops.length,
              }
            : (profile.start_lat && profile.start_lng ? { lat: profile.start_lat, lng: profile.start_lng } : { lat: plant.lat, lng: plant.lng });
          availableSlots.push({ techniker_id: profile.id, datum, centroid, remaining_mins: cap.available_mins });
        }
      }

      const best = findBestAlternativeTechnician(plant, availableSlots);
      if (!best) {
        warnings.push(`Anlage ${plant.id} konnte nach Abwesenheit nicht umgeplant werden.`);
        continue;
      }
      const existingStops = allStopRows.filter(s => s.techniker_id === best.techniker_id && s.datum === best.datum);
      allStopRows.push({
        tour_id: tourId,
        techniker_id: best.techniker_id,
        datum: best.datum,
        position: existingStops.length,
        item_type: "wartung",
        anlage_id: parseInt(plant.id),
        geplante_startzeit: "00:00:00",
        fahrtzeit_minuten: 0,
        dauer_minuten: plant.dauer_minuten,
        original_techniker_id: absentTechId,
      });
      // Reduce remaining capacity on the used slot
      if (capacity[best.techniker_id]?.[best.datum]) {
        capacity[best.techniker_id]![best.datum]!.available_mins -= plant.dauer_minuten;
      }
    }
  }

  // --- Step 7: Ticket Assignment ---
  const availableTechIds = allProfiles
    .filter(p => dates.some(d => (capacity[p.id]?.[d]?.available_mins ?? 0) > 0))
    .map(p => p.id);

  for (const ticket of sortTicketsByPriority(openTickets)) {
    const techId = resolveTicketTechnician(ticket, anlageToTech, availableTechIds);
    if (!techId) { warnings.push(`Ticket #${ticket.ticket_nr ?? ticket.id} konnte keinem Techniker zugeordnet werden.`); continue; }
    const bestDate = dates
      .filter(d => (capacity[techId]?.[d]?.available_mins ?? 0) > 0)
      .sort((a, b) => (capacity[techId]?.[b]?.available_mins ?? 0) - (capacity[techId]?.[a]?.available_mins ?? 0))[0];
    if (!bestDate) continue;
    const existingStops = allStopRows.filter(s => s.techniker_id === techId && s.datum === bestDate);
    allStopRows.push({
      tour_id: tourId,
      techniker_id: techId,
      datum: bestDate,
      position: existingStops.length,
      item_type: "ticket",
      ticket_id: ticket.id,
      geplante_startzeit: "00:00:00",
      fahrtzeit_minuten: 0,
      dauer_minuten: DEFAULT_TICKET_DURATION_MINS,
    });
  }

  // --- Step 8: Save Draft ---
  if (allStopRows.length > 0) {
    const { error: insertError } = await supabase.from("tour_eintraege").insert(allStopRows);
    if (insertError) warnings.push(`Fehler beim Speichern der Tour-Einträge: ${insertError.message}`);
  }

  // Update tickets status to 'eingeplant'
  const ticketIds = allStopRows.filter(s => s.item_type === "ticket").map(s => s.ticket_id!);
  if (ticketIds.length > 0) {
    await supabase.from("tickets").update({ status: "eingeplant" }).in("id", ticketIds);
  }

  // Flag partial
  if (partial) {
    await supabase.from("touren").update({ partial: true }).eq("id", tourId);
  }

  return { tourId, warnings, partial };
}
