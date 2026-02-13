// Customer/Owner (Eigentümer) - based on Tblanl_eigentuemer
export interface Customer {
  anlId: number;
  firma?: string;
  nachname: string;
  vorname: string;
  titel?: string;
  anrede?: string;
  strasse?: string;
  hausNr?: string;
  plz?: string;
  ort?: string;
  ortsteil?: string;
  eigentuemerNr?: string;
  telefonNr?: string;
  telefonNrGesch?: string;
  mobilNr?: string;
  email?: string;
  anmerkungen?: string;
}

export type SortField =
  | "eigentuemerNr"
  | "nachname"
  | "vorname"
  | "ort"
  | "plz"
  | "email"
  | "telefonNr";

export type SortDirection = "asc" | "desc";

export interface CustomerQueryParams {
  search?: string;
  filterOrt?: string;
  sortField?: SortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface CustomerQueryResult {
  data: Customer[];
  totalCount: number;
  filterOptions: { orte: string[] };
}
