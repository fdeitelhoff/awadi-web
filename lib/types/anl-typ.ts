// AnlTypFull — maps 1:1 to public.anl_typen table
// Note: id is NOT auto-generated (legacy PK, max+1 on insert)
export interface AnlTypFull {
  id: number;
  sortiernr?: number;
  bezeichnung: string;
  bio_felder?: string;
  preis_je_wartung: number;
  preis_je_kontrolle: number;
  wartungsintervall_monate: number;
  dauer_wartung_minuten: number;
  dauer_kontrolle_minuten?: number;
  comment?: string;
  last_update?: string;
  created_at: string;
}

export type AnlTypSortField =
  | "sortiernr"
  | "bezeichnung"
  | "wartungsintervall_monate";

export interface AnlTypQueryParams {
  search?: string;
  sortField?: AnlTypSortField;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface AnlTypQueryResult {
  data: AnlTypFull[];
  totalCount: number;
}
