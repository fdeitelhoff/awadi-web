import { createClient } from "@/lib/supabase/server";
import type {
  AnlTypBioFeld,
  AnlTypFull,
  AnlTypQueryParams,
  AnlTypQueryResult,
  AnlTypSortField,
} from "@/lib/types/anl-typ";

const SORT_FIELD_TO_COLUMN: Record<AnlTypSortField, string> = {
  sortiernr: "sortiernr",
  bezeichnung: "bezeichnung",
  wartungsintervall_monate: "wartungsintervall_monate",
};

function mapRowToAnlTyp(row: Record<string, unknown>): AnlTypFull {
  return {
    id: row.id as number,
    sortiernr: row.sortiernr as number | undefined,
    bezeichnung: row.bezeichnung as string,
    preis_je_wartung: row.preis_je_wartung as number,
    preis_je_kontrolle: row.preis_je_kontrolle as number,
    wartungsintervall_monate: row.wartungsintervall_monate as number,
    dauer_wartung_minuten: row.dauer_wartung_minuten as number,
    dauer_kontrolle_minuten: row.dauer_kontrolle_minuten as number | undefined,
    anzahl_vorklaerbehaelter: row.anzahl_vorklaerbehaelter as number | undefined,
    anzahl_biologien: row.anzahl_biologien as number | undefined,
    last_update: row.last_update as string | undefined,
    created_at: row.created_at as string,
  };
}

export async function getAnlTypenFull(
  params: AnlTypQueryParams = {}
): Promise<AnlTypQueryResult> {
  const {
    search = "",
    sortField = "sortiernr",
    sortDirection = "asc",
    page = 1,
    pageSize = 20,
  } = params;

  const supabase = await createClient();

  let query = supabase
    .from("anl_typen")
    .select("*", { count: "exact" });

  if (search.trim()) {
    query = query.ilike("bezeichnung", `%${search.trim()}%`);
  }

  const dbColumn = SORT_FIELD_TO_COLUMN[sortField] ?? "sortiernr";
  query = query.order(dbColumn, {
    ascending: sortDirection === "asc",
    nullsFirst: false,
  });
  // Secondary sort: always sort by bezeichnung after the primary
  if (sortField !== "bezeichnung") {
    query = query.order("bezeichnung", { ascending: true });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching anl_typen:", error);
    return { data: [], totalCount: 0 };
  }

  return {
    data: (data ?? []).map((r) => mapRowToAnlTyp(r as Record<string, unknown>)),
    totalCount: count ?? 0,
  };
}

export async function getAnlTypById(id: number): Promise<AnlTypFull | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("anl_typen")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapRowToAnlTyp(data as Record<string, unknown>);
}

export async function getBioFelder(anl_typ_id: number): Promise<AnlTypBioFeld[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("anl_typ_bio_felder")
    .select("id, anl_typ_id, sortiernr, bio_key, bio_name")
    .eq("anl_typ_id", anl_typ_id)
    .order("sortiernr");

  if (error) {
    console.error("Error fetching bio_felder:", error);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id as number,
    anl_typ_id: r.anl_typ_id as number,
    sortiernr: r.sortiernr as number,
    bio_key: r.bio_key as string,
    bio_name: r.bio_name as string | null,
  }));
}

export async function getAnlTypCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("anl_typen")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error fetching anl_typen count:", error);
    return 0;
  }

  return count ?? 0;
}
