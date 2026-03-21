import { createClient } from "@/lib/supabase/server";
import type {
  AnlTyp,
  AnlageListItem,
  AnlageQueryResult,
  SortField,
} from "@/lib/types/anlage";

const SORT_FIELD_TO_COLUMN: Record<SortField, string> = {
  anlagen_nr: "anlagen_nr",
  ort: "ort",
  plz: "plz",
};

export function mapRowToAnlage(row: Record<string, unknown>): AnlageListItem {
  return {
    id: row.id as number,
    kunden_id: row.kunden_id as number,
    anlagen_nr: row.anlagen_nr as string | undefined,
    verfahren_br_anz_behaelter: row.verfahren_br_anz_behaelter as
      | number
      | undefined,
    strasse: row.strasse as string | undefined,
    hausnr: row.hausnr as string | undefined,
    laenderkennung: row.laenderkennung as string | undefined,
    plz: row.plz as string | undefined,
    ort: row.ort as string | undefined,
    ortsteil: row.ortsteil as string | undefined,
    gemarkung: row.gemarkung as string | undefined,
    flur: row.flur as string | undefined,
    flurstueck: row.flurstueck as string | undefined,
    rechtswert: row.rechtswert as string | undefined,
    hochwert: row.hochwert as string | undefined,
    breitengrad: row.breitengrad as string | undefined,
    laengengrad: row.laengengrad as string | undefined,
    anlage_ausgelegt_ew: row.anlage_ausgelegt_ew as number | undefined,
    tatsaechliche_ew: row.tatsaechliche_ew as number | undefined,
    gesamtgroesse_vk: row.gesamtgroesse_vk as number | undefined,
    kontakt_kunde_id: row.kontakt_kunde_id as number | undefined,
    kontakt_id: row.kontakt_id as number | undefined,
    cleaning_class: row.cleaning_class as string | undefined,
    oxygen_demand_class: row.oxygen_demand_class as string | undefined,
    discharged_in: row.discharged_in as string | undefined,
    number_of_biologies: row.number_of_biologies as number | undefined,
    groesse_vk1: row.groesse_vk1 as number | undefined,
    groesse_vk2: row.groesse_vk2 as number | undefined,
    groesse_vk3: row.groesse_vk3 as number | undefined,
    groesse_vk4: row.groesse_vk4 as number | undefined,
    last_update: row.last_update as string | undefined,
    created_at: row.created_at as string,
    // View-computed fields
    owner_kundennr: row.owner_kundennr as string | undefined,
    owner_name: row.owner_name as string | undefined,
    owner_telefonnr: row.owner_telefonnr as string | undefined,
    owner_email: row.owner_email as string | undefined,
    owner_strasse: row.owner_strasse as string | undefined,
    owner_hausnr: row.owner_hausnr as string | undefined,
    owner_plz: row.owner_plz as string | undefined,
    owner_ort: row.owner_ort as string | undefined,
    anl_typ_id: row.anl_typ_id as number | undefined,
    anl_typ_bezeichnung: row.anl_typ_bezeichnung as string | undefined,
    hersteller: row.hersteller as string | undefined,
    typ: row.typ as string | undefined,
    techniker_id: row.techniker_id as string | undefined,
    techniker_name: row.techniker_name as string | undefined,
    // Contact person fields
    kontakt_typ: row.kontakt_typ as string | undefined,
    kontakt_name: row.kontakt_name as string | undefined,
    kontakt_telefonnr: row.kontakt_telefonnr as string | undefined,
    kontakt_email: row.kontakt_email as string | undefined,
    kontakt_strasse: row.kontakt_strasse as string | undefined,
    kontakt_hausnr: row.kontakt_hausnr as string | undefined,
    kontakt_plz: row.kontakt_plz as string | undefined,
    kontakt_ort: row.kontakt_ort as string | undefined,
  };
}

export async function getAnlagen(
  params: {
    search?: string;
    filterOrt?: string;
    sortField?: SortField;
    sortDirection?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  } = {}
): Promise<AnlageQueryResult> {
  const {
    search = "",
    filterOrt,
    sortField = "anlagen_nr",
    sortDirection = "asc",
    page = 1,
    pageSize = 14,
  } = params;

  const supabase = await createClient();

  // Use the anlagen_details view to get owner name in the list
  let query = supabase
    .from("anlagen_details")
    .select("*", { count: "exact" });

  if (search.trim()) {
    const pattern = `%${search.trim()}%`;
    query = query.or(
      [
        `anlagen_nr.ilike.${pattern}`,
        `ort.ilike.${pattern}`,
        `plz.ilike.${pattern}`,
        `strasse.ilike.${pattern}`,
        `owner_kundennr.ilike.${pattern}`,
        `owner_name.ilike.${pattern}`,
      ].join(",")
    );
  }

  if (filterOrt && filterOrt !== "all") {
    query = query.eq("ort", filterOrt);
  }

  const dbColumn = SORT_FIELD_TO_COLUMN[sortField] ?? "anlagen_nr";
  query = query.order(dbColumn, {
    ascending: sortDirection === "asc",
    nullsFirst: false,
  });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching anlagen:", error);
    return { data: [], totalCount: 0, filterOptions: { orte: [] } };
  }

  const anlagen = (data ?? []).map(mapRowToAnlage);
  const filterOptions = await getAnlageFilterOptions();

  return {
    data: anlagen,
    totalCount: count ?? 0,
    filterOptions,
  };
}

export async function getAnlageFilterOptions(): Promise<{ orte: string[] }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("anlagen")
    .select("ort")
    .not("ort", "is", null)
    .order("ort");

  if (error) {
    console.error("Error fetching anlage filter options:", error);
    return { orte: [] };
  }

  const orte = [...new Set((data ?? []).map((r) => r.ort as string))];
  return { orte };
}

export async function getAnlageById(
  id: number
): Promise<AnlageListItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("anlagen_details")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapRowToAnlage(data as Record<string, unknown>);
}

export async function getAnlTypen(): Promise<AnlTyp[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("anl_typen")
    .select("id, bezeichnung")
    .order("sortiernr", { nullsFirst: false })
    .order("bezeichnung");

  if (error) {
    console.error("Error fetching anl_typen:", error);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id as number,
    bezeichnung: r.bezeichnung as string,
  }));
}

export async function getActiveTechniker(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, vorname, nachname, email")
    .eq("aktiv", true)
    .order("nachname", { nullsFirst: false })
    .order("vorname", { nullsFirst: false });

  if (error) {
    console.error("Error fetching active techniker:", error);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id as string,
    name:
      [r.vorname, r.nachname].filter(Boolean).join(" ") ||
      (r.email as string),
  }));
}

export async function getAnlageCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("anlagen")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error fetching anlagen count:", error);
    return 0;
  }

  return count ?? 0;
}
