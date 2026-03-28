// lib/actions/touren.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getTourEintraege } from "@/lib/data/touren";
import { nearestNeighborOrder, calcArrivalTimes, minsToTimeString } from "@/lib/algorithm/routing";
import { buildCapacityMap } from "@/lib/algorithm/capacity";
import { buildTravelMatrix, normalizeCoord } from "@/lib/algorithm/travel-matrix";
import type { TourEintrag } from "@/lib/types/tour";
import type { Abwesenheit } from "@/lib/types/abwesenheit";
import type { Profile } from "@/lib/types/profile";

export async function publishTour(
  tourId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("touren")
    .update({ status: "veröffentlicht", updated_at: new Date().toISOString() })
    .eq("id", tourId)
    .eq("status", "entwurf");
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function revertToDraft(
  tourId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("touren")
    .update({ status: "entwurf", updated_at: new Date().toISOString() })
    .eq("id", tourId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteTour(
  tourId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  // Revert ticket statuses first
  const { data: ticketStops } = await supabase
    .from("tour_eintraege")
    .select("ticket_id")
    .eq("tour_id", tourId)
    .eq("item_type", "ticket");
  const ticketIds = (ticketStops ?? []).map(s => s.ticket_id).filter(Boolean) as number[];
  if (ticketIds.length > 0) {
    await supabase.from("tickets").update({ status: "offen" }).in("id", ticketIds);
  }
  const { error } = await supabase.from("touren").delete().eq("id", tourId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function moveTourEintrag(
  stopId: number,
  newTechnikerId: string,
  newDatum: string,
  newPosition: number
): Promise<{ success: boolean; eintraege?: TourEintrag[]; error?: string }> {
  const supabase = await createClient();

  // Get the stop to find its tour_id and original day
  const { data: stop, error: fetchErr } = await supabase
    .from("tour_eintraege")
    .select("*")
    .eq("id", stopId)
    .single();
  if (fetchErr || !stop) return { success: false, error: "Stop not found" };

  const tourId = stop.tour_id as number;
  const oldTechId = stop.techniker_id as string;
  const oldDatum = stop.datum as string;

  // Update the moved stop
  const { error: updateErr } = await supabase
    .from("tour_eintraege")
    .update({ techniker_id: newTechnikerId, datum: newDatum, position: newPosition })
    .eq("id", stopId);
  if (updateErr) return { success: false, error: updateErr.message };

  // Repack positions for affected days
  for (const [techId, datum] of [[oldTechId, oldDatum], [newTechnikerId, newDatum]]) {
    const { data: dayStops } = await supabase
      .from("tour_eintraege")
      .select("id")
      .eq("tour_id", tourId)
      .eq("techniker_id", techId)
      .eq("datum", datum)
      .order("position", { ascending: true });
    for (let i = 0; i < (dayStops ?? []).length; i++) {
      await supabase.from("tour_eintraege").update({ position: i }).eq("id", dayStops![i]!.id);
    }
  }

  const updated = await getTourEintraege(tourId);
  return { success: true, eintraege: updated };
}

export async function removeTicketFromTour(
  stopId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: stop } = await supabase
    .from("tour_eintraege").select("ticket_id").eq("id", stopId).single();
  if (stop?.ticket_id) {
    await supabase.from("tickets").update({ status: "offen" }).eq("id", stop.ticket_id);
  }
  const { error } = await supabase.from("tour_eintraege").delete().eq("id", stopId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function reoptimiseDay(
  tourId: number,
  technikerId: string,
  datum: string
): Promise<{ success: boolean; eintraege?: TourEintrag[]; error?: string }> {
  const supabase = await createClient();
  const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? "";

  // Load current stops for this day
  const { data: dayStops } = await supabase
    .from("tour_eintraege")
    .select("*, anlagen(breitengrad, laengengrad)")
    .eq("tour_id", tourId)
    .eq("techniker_id", technikerId)
    .eq("datum", datum)
    .order("position", { ascending: true });

  if (!dayStops || dayStops.length === 0) return { success: true, eintraege: [] };

  // Get technician profile for start point + capacity
  const { data: profileData } = await supabase
    .from("profiles").select("*").eq("id", technikerId).single();
  const profile = profileData as Profile | null;
  const { data: absData } = await supabase
    .from("user_abwesenheiten").select("*")
    .lte("von", datum + "T23:59:59Z").gte("bis", datum + "T00:00:00Z")
    .eq("user_id", technikerId);

  const capacityMap = buildCapacityMap(
    profile ? [profile] : [],
    (absData ?? []) as Abwesenheit[],
    [datum]
  );
  const capInfo = capacityMap[technikerId]?.[datum];
  if (!capInfo || capInfo.available_mins === 0) return { success: false, error: "No capacity" };

  const startPoint = profile?.start_lat && profile?.start_lng
    ? { lat: profile.start_lat, lng: profile.start_lng }
    : null;

  type StopWithCoords = { id: number; lat: number; lng: number; dauer_minuten: number };
  const routableStops: StopWithCoords[] = [];
  for (const s of dayStops) {
    const anlage = s.anlagen as { breitengrad?: string; laengengrad?: string } | null;
    if (!anlage?.breitengrad || !anlage?.laengengrad) continue;
    routableStops.push({
      id: s.id as number,
      lat: normalizeCoord(anlage.breitengrad),
      lng: normalizeCoord(anlage.laengengrad),
      dauer_minuten: (s.dauer_minuten as number) ?? 60,
    });
  }

  if (routableStops.length === 0) return { success: true, eintraege: [] };
  const origin = startPoint ?? { lat: routableStops[0]!.lat, lng: routableStops[0]!.lng };
  const allPoints = [origin, ...routableStops.map(s => ({ lat: s.lat, lng: s.lng }))];
  const matrix = await buildTravelMatrix(allPoints, mapsApiKey);

  const routables = routableStops.map(s => ({ ...s, id: String(s.id) }));
  const ordered = nearestNeighborOrder(routables, origin, matrix);
  const scheduled = calcArrivalTimes(ordered, origin, capInfo.route_start_mins, matrix);

  // Write back positions and times
  for (const stop of scheduled) {
    await supabase.from("tour_eintraege").update({
      position: stop.position,
      geplante_startzeit: minsToTimeString(stop.geplante_startzeit_mins),
      fahrtzeit_minuten: stop.fahrtzeit_minuten,
    }).eq("id", parseInt(stop.id));
  }

  const updated = await getTourEintraege(tourId);
  return { success: true, eintraege: updated };
}
