import { createClient } from "@/lib/supabase/server";
import type {
  Customer,
  CustomerQueryResult,
  SortField,
} from "@/lib/types/customer";

const SORT_FIELD_TO_COLUMN: Record<SortField, string> = {
  eigentuemerNr: "EigentuemerNr",
  nachname: "Nachname",
  vorname: "Vorname",
  ort: "Ort",
  plz: "PLZ",
  email: "Email",
  telefonNr: "TelefonNr",
};

export function mapRowToCustomer(row: Record<string, unknown>): Customer {
  return {
    anlId: row.AnlID as number,
    eigentuemerNr: row.EigentuemerNr as string | undefined,
    nachname: row.Nachname as string,
    vorname: row.Vorname as string,
    firma: row.Firma as string | undefined,
    titel: row.Titel as string | undefined,
    anrede: row.Anrede as string | undefined,
    strasse: row.Strasse as string | undefined,
    hausNr: row.HausNr as string | undefined,
    plz: row.PLZ as string | undefined,
    ort: row.Ort as string | undefined,
    ortsteil: row.Ortsteil as string | undefined,
    telefonNr: row.TelefonNr as string | undefined,
    telefonNrGesch: row.TelefonNrGesch as string | undefined,
    mobilNr: row.MobilNr as string | undefined,
    email: row.Email as string | undefined,
    anmerkungen: row.Anmerkungen as string | undefined,
  };
}

export async function getCustomers(params: {
  search?: string;
  filterOrt?: string;
  sortField?: SortField;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
} = {}): Promise<CustomerQueryResult> {
  const {
    search = "",
    filterOrt,
    sortField = "nachname",
    sortDirection = "asc",
    page = 1,
    pageSize = 10,
  } = params;

  const supabase = await createClient();

  let query = supabase
    .from("Tblanl_eigentuemer")
    .select("*", { count: "exact" });

  if (search.trim()) {
    const pattern = `%${search.trim()}%`;
    query = query.or(
      [
        `Nachname.ilike.${pattern}`,
        `Vorname.ilike.${pattern}`,
        `Firma.ilike.${pattern}`,
        `EigentuemerNr.ilike.${pattern}`,
        `Ort.ilike.${pattern}`,
        `PLZ.ilike.${pattern}`,
        `Email.ilike.${pattern}`,
        `Strasse.ilike.${pattern}`,
      ].join(",")
    );
  }

  if (filterOrt && filterOrt !== "all") {
    query = query.eq("Ort", filterOrt);
  }

  const dbColumn = SORT_FIELD_TO_COLUMN[sortField] ?? "Nachname";
  query = query.order(dbColumn, { ascending: sortDirection === "asc" });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching customers:", error);
    return { data: [], totalCount: 0, filterOptions: { orte: [] } };
  }

  const customers = (data ?? []).map(mapRowToCustomer);
  const filterOptions = await getCustomerFilterOptions();

  return {
    data: customers,
    totalCount: count ?? 0,
    filterOptions,
  };
}

export async function getCustomerFilterOptions(): Promise<{
  orte: string[];
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("Tblanl_eigentuemer")
    .select("Ort")
    .not("Ort", "is", null)
    .order("Ort");

  if (error) {
    console.error("Error fetching filter options:", error);
    return { orte: [] };
  }

  const orte = [...new Set((data ?? []).map((r) => r.Ort as string))];
  return { orte };
}

export async function getCustomerCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("Tblanl_eigentuemer")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error fetching customer count:", error);
    return 0;
  }

  return count ?? 0;
}
