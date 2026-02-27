// Vertrag — maps to public.wartungsvertraege, with joined display fields
export interface Vertrag {
  id: number;
  anlage_id: number;
  kunden_id?: number;
  vertragsnummer?: string;
  vertragsdatum?: string;
  gueltig_ab?: string;
  gueltig_bis?: string;
  anl_typ_id?: number;
  intervall_monate?: number;
  dauer_wartung_minuten?: number;
  preis_je_wartung?: number;
  aktiv: boolean;
  datum_naechste_wartung?: string;
  wartungsvertrag_flag?: number;
  datum_wartungsvertrag?: string;
  export_erlaubt_wartung?: boolean;
  comment?: string;
  last_update?: string;
  created_at: string;

  // Joined from anlagen
  anlagen_nr?: string;
  // Joined from kunden (derived display name)
  kunde_name?: string;
}

export type VertragSortField =
  | "vertragsnummer"
  | "gueltig_ab"
  | "gueltig_bis"
  | "intervall_monate";

export type SortDirection = "asc" | "desc";

export type VertragFilterAktiv = "all" | "aktiv" | "inaktiv";

export interface VertragQueryParams {
  search?: string;
  filterAktiv?: VertragFilterAktiv;
  sortField?: VertragSortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface VertragQueryResult {
  data: Vertrag[];
  totalCount: number;
}
