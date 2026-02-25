// Anlage — maps 1:1 to public.anlagen table
export interface Anlage {
  id: number;
  kunden_id: number;
  ist_aktiv: boolean;
  anlagen_nr?: string;

  verfahren_br_anz_behaelter?: number;

  // Facility address
  strasse?: string;
  hausnr?: string;
  laenderkennung?: string;
  plz?: string;
  ort?: string;
  ortsteil?: string;

  // Cadastral data
  gemarkung?: string;
  flur?: string;
  flurstueck?: string;

  // Sizing
  anlage_ausgelegt_ew?: number;
  tatsaechliche_ew?: number;
  gesamtgroesse_vk?: number;

  // Tour / route planning
  touren_nr?: string;
  touren_nr2?: string;
  touren_nr3?: string;

  // Scheduling
  datum_naechste_wartung?: string;
  datum_abgabefrei_seit?: string;

  // Contract
  wartungsvertrag_flag?: number;
  datum_wartungsvertrag?: string;
  export_erlaubt_wartung: boolean;

  // Contact references
  kontakt_kunde_id?: number;
  kontakt_id?: number;
  ansprechpartner_legacy?: string;
  telefonnr_legacy?: string;

  comment?: string;
  anmerkungen_gesamt?: string;
  bezeichnung?: string;

  trace_mark?: number;
  last_update?: string;
  created_at: string;
}

// Extended type with joined owner/contact fields from anlagen_details view
export interface AnlageListItem extends Anlage {
  owner_kundennr?: string;
  owner_name?: string;
  owner_telefonnr?: string;
  owner_email?: string;
}

export type SortField =
  | "anlagen_nr"
  | "ort"
  | "plz"
  | "datum_naechste_wartung"
  | "ist_aktiv";

export type SortDirection = "asc" | "desc";

export interface AnlageQueryParams {
  search?: string;
  filterOrt?: string;
  sortField?: SortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface AnlageQueryResult {
  data: AnlageListItem[];
  totalCount: number;
  filterOptions: { orte: string[] };
}
