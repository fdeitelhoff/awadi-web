import { createClient } from "@/lib/supabase/server";
import type {
  AnlageListItem,
  AnlageQueryResult,
  SortField,
} from "@/lib/types/anlage";

const SORT_FIELD_TO_COLUMN: Record<SortField, string> = {
  anlagen_nr: "anlagen_nr",
  ort: "ort",
  plz: "plz",
  datum_naechste_wartung: "datum_naechste_wartung",
  ist_aktiv: "ist_aktiv",
};

export function mapRowToAnlage(row: Record<string, unknown>): AnlageListItem {
  return {
    id: row.id as number,
    kunden_id: row.kunden_id as number,
    ist_aktiv: row.ist_aktiv as boolean,
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
    anlage_ausgelegt_ew: row.anlage_ausgelegt_ew as number | undefined,
    tatsaechliche_ew: row.tatsaechliche_ew as number | undefined,
    gesamtgroesse_vk: row.gesamtgroesse_vk as number | undefined,
    touren_nr: row.touren_nr as string | undefined,
    touren_nr2: row.touren_nr2 as string | undefined,
    touren_nr3: row.touren_nr3 as string | undefined,
    datum_naechste_wartung: row.datum_naechste_wartung as string | undefined,
    datum_abgabefrei_seit: row.datum_abgabefrei_seit as string | undefined,
    wartungsvertrag_flag: row.wartungsvertrag_flag as number | undefined,
    datum_wartungsvertrag: row.datum_wartungsvertrag as string | undefined,
    export_erlaubt_wartung: row.export_erlaubt_wartung as boolean,
    kontakt_kunde_id: row.kontakt_kunde_id as number | undefined,
    kontakt_id: row.kontakt_id as number | undefined,
    ansprechpartner_legacy: row.ansprechpartner_legacy as string | undefined,
    telefonnr_legacy: row.telefonnr_legacy as string | undefined,
    comment: row.comment as string | undefined,
    anmerkungen_gesamt: row.anmerkungen_gesamt as string | undefined,
    bezeichnung: row.bezeichnung as string | undefined,
    trace_mark: row.trace_mark as number | undefined,
    last_update: row.last_update as string | undefined,
    created_at: row.created_at as string,
    // View-computed fields
    owner_kundennr: row.owner_kundennr as string | undefined,
    owner_name: row.owner_name as string | undefined,
    owner_telefonnr: row.owner_telefonnr as string | undefined,
    owner_email: row.owner_email as string | undefined,
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
