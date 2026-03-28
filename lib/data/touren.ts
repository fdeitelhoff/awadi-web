import { createClient } from "@/lib/supabase/server";
import type { Tour, TourEintrag, TourQueryResult } from "@/lib/types/tour";

export function mapRowToTour(row: Record<string, unknown>): Tour {
  const profiles = row.profiles as { vorname?: string; nachname?: string } | null;
  const technikerSet = new Set((row.tour_eintraege as Array<{ techniker_id: string }> | null ?? []).map(e => e.techniker_id));
  return {
    id: row.id as number,
    name: row.name as string,
    von: row.von as string,
    bis: row.bis as string,
    status: row.status as Tour["status"],
    created_by: row.created_by as string,
    partial: row.partial as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string | undefined,
    created_by_name: profiles
      ? [profiles.vorname, profiles.nachname].filter(Boolean).join(" ") || undefined
      : undefined,
    techniker_count: technikerSet.size,
    stop_count: (row.tour_eintraege as unknown[] | null)?.length ?? 0,
  };
}

export async function getTouren(params: {
  page?: number; pageSize?: number;
} = {}): Promise<TourQueryResult> {
  const { page = 1, pageSize = 20 } = params;
  const supabase = await createClient();
  const from = (page - 1) * pageSize;

  const { data, count, error } = await supabase
    .from("touren")
    .select("*, profiles(vorname, nachname), tour_eintraege(techniker_id)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) { console.error("getTouren:", error); return { data: [], totalCount: 0 }; }
  return { data: (data ?? []).map(r => mapRowToTour(r as Record<string, unknown>)), totalCount: count ?? 0 };
}

export async function getTourById(id: number): Promise<Tour | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("touren")
    .select("*, profiles(vorname, nachname), tour_eintraege(techniker_id)")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mapRowToTour(data as Record<string, unknown>);
}

export function mapRowToTourEintrag(row: Record<string, unknown>): TourEintrag {
  const anlage = row.anlagen as Record<string, unknown> | null;
  const ticket = row.tickets as Record<string, unknown> | null;
  const profile = row.profiles as Record<string, unknown> | null;
  return {
    id: row.id as number,
    tour_id: row.tour_id as number,
    techniker_id: row.techniker_id as string,
    datum: row.datum as string,
    position: row.position as number,
    item_type: row.item_type as TourEintrag["item_type"],
    anlage_id: row.anlage_id as number | undefined,
    ticket_id: row.ticket_id as number | undefined,
    geplante_startzeit: row.geplante_startzeit as string | undefined,
    fahrtzeit_minuten: row.fahrtzeit_minuten as number | undefined,
    dauer_minuten: row.dauer_minuten as number | undefined,
    original_techniker_id: row.original_techniker_id as string | undefined,
    notizen: row.notizen as string | undefined,
    created_at: row.created_at as string,
    techniker_name: profile
      ? [profile.vorname, profile.nachname].filter(Boolean).join(" ") || undefined
      : undefined,
    anlage_name: anlage?.name as string | undefined,
    anlage_lat: anlage?.breitengrad ? parseFloat(anlage.breitengrad as string) : undefined,
    anlage_lng: anlage?.laengengrad ? parseFloat(anlage.laengengrad as string) : undefined,
    anlage_adresse: anlage
      ? [anlage.strasse, anlage.hausnr, anlage.ort].filter(Boolean).join(" ") || undefined
      : undefined,
    ticket_titel: ticket?.titel as string | undefined,
  };
}

export async function getTourEintraege(tourId: number): Promise<TourEintrag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tour_eintraege")
    .select("*, profiles!tour_eintraege_techniker_id_fkey(vorname, nachname), anlagen(name, breitengrad, laengengrad, strasse, hausnr, ort), tickets(titel)")
    .eq("tour_id", tourId)
    .order("datum", { ascending: true })
    .order("position", { ascending: true });
  if (error) { console.error("getTourEintraege:", error); return []; }
  return (data ?? []).map(r => mapRowToTourEintrag(r as Record<string, unknown>));
}

export async function getPublishedTourEintraegeForDateRange(von: string, bis: string): Promise<TourEintrag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tour_eintraege")
    .select("*, profiles!tour_eintraege_techniker_id_fkey(vorname, nachname), anlagen(name, breitengrad, laengengrad, strasse, hausnr, ort), tickets(titel), touren!inner(status)")
    .eq("touren.status", "veröffentlicht")
    .gte("datum", von)
    .lte("datum", bis);
  if (error) { console.error("getPublishedTourEintraegeForDateRange:", error); return []; }
  return (data ?? []).map(r => mapRowToTourEintrag(r as Record<string, unknown>));
}
