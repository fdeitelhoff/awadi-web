// Kontakt — maps 1:1 to public.kontakte table (id is auto-generated)
export interface Kontakt {
  id: number;
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
  mobilnr?: string;
  email?: string;
  anmerkungen?: string;
  last_update?: string;
  created_at: string;
}

export interface KontaktFormData {
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
  mobilnr?: string;
  email?: string;
  anmerkungen?: string;
}

export type KontaktSortField =
  | "nachname"
  | "vorname"
  | "ort"
  | "plz"
  | "telefonnr"
  | "mobilnr"
  | "email";

export type SortDirection = "asc" | "desc";

export interface KontaktQueryParams {
  search?: string;
  filterOrt?: string;
  sortField?: KontaktSortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface KontaktQueryResult {
  data: Kontakt[];
  totalCount: number;
  filterOptions: { orte: string[] };
}
