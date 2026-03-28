// Vertrag — maps to public.wartungsvertraege, with joined display fields
export interface Vertrag {
  id: number;
  anlage_id: number;
  kunden_id?: number;
  gueltig_ab?: string;
  gueltig_bis?: string;
  anl_typ_id?: number;
  intervall_monate?: number;
  dauer_wartung_minuten?: number;
  datum_naechste_wartung?: string;
  datum_letzte_wartung?: string;
  last_update?: string;
  created_at: string;

  // Joined from anlagen
  anlagen_nr?: string;
  // Joined from kunden (derived display name)
  kunde_name?: string;
}

export type VertragSortField =
  | "gueltig_ab"
  | "gueltig_bis"
  | "intervall_monate";

export type SortDirection = "asc" | "desc";

export interface VertragQueryParams {
  search?: string;
  kundenId?: number;
  anlageId?: number;
  sortField?: VertragSortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface VertragQueryResult {
  data: Vertrag[];
  totalCount: number;
}
