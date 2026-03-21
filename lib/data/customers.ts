import { createClient } from "@/lib/supabase/server";
import type { Kunde, KundeQueryResult, KundeFilterAktiv, SortField } from "@/lib/types/customer";

const SORT_FIELD_TO_COLUMN: Record<SortField, string> = {
  kundennr: "kundennr",
  nachname: "nachname",
  vorname: "vorname",
  ort: "ort",
  plz: "plz",
  email: "email",
  telefonnr: "telefonnr",
};

export function mapRowToKunde(row: Record<string, unknown>): Kunde {
  return {
    id: row.id as number,
    kundennr: row.kundennr as string | undefined,
    ist_kunde: row.ist_kunde as boolean | undefined,
    hat_aktiven_vertrag: row.hat_aktiven_vertrag as boolean | undefined,
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
    telefonnr_geschaeft: row.telefonnr_geschaeft as string | undefined,
    mobilnr: row.mobilnr as string | undefined,
    mobilnr2: row.mobilnr2 as string | undefined,
    email: row.email as string | undefined,
    email_secondary: row.email_secondary as string | undefined,
    homepage: row.homepage as string | undefined,
    last_update: row.last_update as string | undefined,
    created_at: row.created_at as string,
  };
}

// Alias for any remaining callers that use the old name
export const mapRowToCustomer = mapRowToKunde;

export async function getCustomers(
  params: {
    search?: string;
    filterOrt?: string;
    filterAktiv?: KundeFilterAktiv;
    sortField?: SortField;
    sortDirection?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  } = {}
): Promise<KundeQueryResult> {
  const {
    search = "",
    filterOrt,
    filterAktiv = "all",
    sortField = "nachname",
    sortDirection = "asc",
    page = 1,
    pageSize = 14,
  } = params;

  const supabase = await createClient();

  let query = supabase.from("kunden_details").select("*", { count: "exact" });

  if (search.trim()) {
    const pattern = `%${search.trim()}%`;
    query = query.or(
      [
        `nachname.ilike.${pattern}`,
        `vorname.ilike.${pattern}`,
        `firma.ilike.${pattern}`,
        `kundennr.ilike.${pattern}`,
        `ort.ilike.${pattern}`,
        `plz.ilike.${pattern}`,
        `email.ilike.${pattern}`,
        `strasse.ilike.${pattern}`,
      ].join(",")
    );
  }

  if (filterOrt && filterOrt !== "all") {
    query = query.eq("ort", filterOrt);
  }

  if (filterAktiv === "aktiv") {
    query = query.eq("ist_kunde", true);
  } else if (filterAktiv === "inaktiv") {
    query = query.eq("ist_kunde", false);
  }

  const dbColumn = SORT_FIELD_TO_COLUMN[sortField] ?? "nachname";
  query = query.order(dbColumn, { ascending: sortDirection === "asc" });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching kunden:", error);
    return { data: [], totalCount: 0, filterOptions: { orte: [] } };
  }

  const kunden = (data ?? []).map(mapRowToKunde);
  const filterOptions = await getCustomerFilterOptions();

  return {
    data: kunden,
    totalCount: count ?? 0,
    filterOptions,
  };
}

export async function getCustomerFilterOptions(): Promise<{ orte: string[] }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("kunden")
    .select("ort")
    .not("ort", "is", null)
    .order("ort");

  if (error) {
    console.error("Error fetching filter options:", error);
    return { orte: [] };
  }

  const orte = [...new Set((data ?? []).map((r) => r.ort as string))];
  return { orte };
}

export async function getCustomerById(id: number): Promise<Kunde | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("kunden")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapRowToKunde(data as Record<string, unknown>);
}

export async function getCustomerCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("kunden")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error fetching kunden count:", error);
    return 0;
  }

  return count ?? 0;
}
