// Kunde — maps 1:1 to public.kunden table (extended by kunden_details view)
export interface Kunde {
  id: number;
  kundennr?: string;
  hat_aktiven_vertrag?: boolean;

  firma?: string;
  nachname?: string;
  vorname?: string;
  titel?: string;
  anrede?: string;

  strasse?: string;
  hausnr?: string;
  laenderkennung?: string;
  plz?: string;
  ort?: string;
  ortsteil?: string;

  telefonnr?: string;
  telefonnr_geschaeft?: string;
  mobilnr?: string;
  mobilnr2?: string;
  email?: string;
  email_secondary?: string;
  homepage?: string;

  trace_mark?: number;
  last_update?: string;
  created_at: string;
}

// Keep Customer as an alias so any remaining references compile
export type Customer = Kunde;

export type SortField =
  | "kundennr"
  | "nachname"
  | "vorname"
  | "ort"
  | "plz"
  | "email"
  | "telefonnr";

export type SortDirection = "asc" | "desc";
export type KundeFilterAktiv = "all" | "aktiv" | "inaktiv";

export interface KundeQueryParams {
  search?: string;
  filterOrt?: string;
  filterAktiv?: KundeFilterAktiv;
  sortField?: SortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}

export type CustomerQueryParams = KundeQueryParams;

export interface KundeQueryResult {
  data: Kunde[];
  totalCount: number;
  filterOptions: { orte: string[] };
}

export type CustomerQueryResult = KundeQueryResult;
