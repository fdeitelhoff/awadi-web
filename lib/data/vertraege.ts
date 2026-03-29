import { createClient } from "@/lib/supabase/server";
import type {
  Vertrag,
  VertragQueryResult,
  VertragSortField,
} from "@/lib/types/vertrag";

const SORT_FIELD_TO_COLUMN: Record<VertragSortField, string> = {
  gueltig_ab: "gueltig_ab",
  gueltig_bis: "gueltig_bis",
  intervall_monate: "intervall_monate",
};

type AnlagenRow = { anlagen_nr: string | null } | null;
type KundenRow = { nachname: string | null; vorname: string | null; firma: string | null } | null;

function deriveKundeName(kunden: KundenRow): string | undefined {
  if (!kunden) return undefined;
  if (kunden.firma) return kunden.firma;
  return [kunden.vorname, kunden.nachname].filter(Boolean).join(" ") || undefined;
}

export function mapRowToVertrag(row: Record<string, unknown>): Vertrag {
  const anlagen = row.anlagen as AnlagenRow;
  const kunden = row.kunden as KundenRow;

  return {
    id: row.id as number,
    anlage_id: row.anlage_id as number,
    kunden_id: row.kunden_id as number | undefined,
    gueltig_ab: row.gueltig_ab as string | undefined,
    gueltig_bis: row.gueltig_bis as string | undefined,
    anl_typ_id: row.anl_typ_id as number | undefined,
    intervall_monate: row.intervall_monate as number | undefined,
    dauer_wartung_minuten: row.dauer_wartung_minuten as number | undefined,
    datum_naechste_wartung: row.datum_naechste_wartung as string | undefined,
    datum_letzte_wartung: row.datum_letzte_wartung as string | undefined,
    last_update: row.last_update as string | undefined,
    created_at: row.created_at as string,
    anlagen_nr: anlagen?.anlagen_nr ?? undefined,
    kunde_name: deriveKundeName(kunden),
  };
}

export async function getVertraege(
  params: {
    search?: string;
    kundenId?: number;
    anlageId?: number;
    sortField?: VertragSortField;
    sortDirection?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  } = {}
): Promise<VertragQueryResult> {
  const {
    search: _search = "",
    kundenId,
    anlageId,
    sortField = "gueltig_ab",
    sortDirection = "desc",
    page = 1,
    pageSize = 14,
  } = params;

  const supabase = await createClient();

  let query = supabase
    .from("wartungsvertraege")
    .select("*, anlagen(anlagen_nr), kunden(nachname, vorname, firma)", {
      count: "exact",
    });

  if (kundenId != null) {
    query = query.eq("kunden_id", kundenId);
  }

  if (anlageId != null) {
    query = query.eq("anlage_id", anlageId);
  }

  const dbColumn = SORT_FIELD_TO_COLUMN[sortField] ?? "gueltig_ab";
  query = query.order(dbColumn, {
    ascending: sortDirection === "asc",
    nullsFirst: false,
  });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching vertraege:", error);
    return { data: [], totalCount: 0 };
  }

  return {
    data: (data ?? []).map(mapRowToVertrag),
    totalCount: count ?? 0,
  };
}

export async function getVertragById(id: number): Promise<Vertrag | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("wartungsvertraege")
    .select("*, anlagen(anlagen_nr), kunden(nachname, vorname, firma)")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapRowToVertrag(data as Record<string, unknown>);
}

export async function getActiveVertragForAnlage(anlageId: number): Promise<Vertrag | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wartungsvertraege")
    .select("*, anlagen(anlagen_nr), kunden(nachname, vorname, firma)")
    .eq("anlage_id", anlageId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapRowToVertrag(data as Record<string, unknown>);
}

export async function getVertragCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("wartungsvertraege")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error fetching vertrag count:", error);
    return 0;
  }

  return count ?? 0;
}
