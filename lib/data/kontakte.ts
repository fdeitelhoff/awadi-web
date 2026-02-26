import { createClient } from "@/lib/supabase/server";
import type {
  Kontakt,
  KontaktQueryResult,
  KontaktSortField,
} from "@/lib/types/kontakt";

const SORT_FIELD_TO_COLUMN: Record<KontaktSortField, string> = {
  nachname: "nachname",
  vorname: "vorname",
  ort: "ort",
  plz: "plz",
  telefonnr: "telefonnr",
  mobilnr: "mobilnr",
  email: "email",
};

export function mapRowToKontakt(row: Record<string, unknown>): Kontakt {
  return {
    id: row.id as number,
    firma: row.firma as string | undefined,
    nachname: row.nachname as string | undefined,
    vorname: row.vorname as string | undefined,
    titel: row.titel as string | undefined,
    anrede: row.anrede as string | undefined,
    strasse: row.strasse as string | undefined,
    hausnr: row.hausnr as string | undefined,
    laenderkennung: row.laenderkennung as string | undefined,
    plz: row.plz as string | undefined,
    ort: row.ort as string | undefined,
    ortsteil: row.ortsteil as string | undefined,
    telefonnr: row.telefonnr as string | undefined,
    mobilnr: row.mobilnr as string | undefined,
    email: row.email as string | undefined,
    anmerkungen: row.anmerkungen as string | undefined,
    last_update: row.last_update as string | undefined,
    created_at: row.created_at as string,
  };
}

export async function getKontakte(
  params: {
    search?: string;
    filterOrt?: string;
    sortField?: KontaktSortField;
    sortDirection?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  } = {}
): Promise<KontaktQueryResult> {
  const {
    search = "",
    filterOrt,
    sortField = "nachname",
    sortDirection = "asc",
    page = 1,
    pageSize = 14,
  } = params;

  const supabase = await createClient();

  let query = supabase.from("kontakte").select("*", { count: "exact" });

  if (search.trim()) {
    const pattern = `%${search.trim()}%`;
    query = query.or(
      [
        `nachname.ilike.${pattern}`,
        `vorname.ilike.${pattern}`,
        `firma.ilike.${pattern}`,
        `ort.ilike.${pattern}`,
        `plz.ilike.${pattern}`,
        `email.ilike.${pattern}`,
        `telefonnr.ilike.${pattern}`,
      ].join(",")
    );
  }

  if (filterOrt && filterOrt !== "all") {
    query = query.eq("ort", filterOrt);
  }

  const dbColumn = SORT_FIELD_TO_COLUMN[sortField] ?? "nachname";
  query = query.order(dbColumn, { ascending: sortDirection === "asc" });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching kontakte:", error);
    return { data: [], totalCount: 0, filterOptions: { orte: [] } };
  }

  const kontakte = (data ?? []).map(mapRowToKontakt);
  const filterOptions = await getKontaktFilterOptions();

  return {
    data: kontakte,
    totalCount: count ?? 0,
    filterOptions,
  };
}

export async function getKontaktFilterOptions(): Promise<{ orte: string[] }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("kontakte")
    .select("ort")
    .not("ort", "is", null)
    .order("ort");

  if (error) {
    console.error("Error fetching kontakt filter options:", error);
    return { orte: [] };
  }

  const orte = [...new Set((data ?? []).map((r) => r.ort as string))];
  return { orte };
}

export async function getKontaktById(id: number): Promise<Kontakt | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("kontakte")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapRowToKontakt(data as Record<string, unknown>);
}

export async function getKontaktCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("kontakte")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error fetching kontakte count:", error);
    return 0;
  }

  return count ?? 0;
}
