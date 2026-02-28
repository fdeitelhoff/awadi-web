export interface UserRolle {
  id: number;
  name: string;
}

export interface Profile {
  id: string;
  email: string;
  vorname?: string;
  nachname?: string;
  rollen_id: number;
  rollen_name?: string; // joined from user_rollen
  telefonnr?: string;
  aktiv: boolean;
  farbe?: string;
  mo_von?: string;
  mo_bis?: string;
  di_von?: string;
  di_bis?: string;
  mi_von?: string;
  mi_bis?: string;
  do_von?: string;
  do_bis?: string;
  fr_von?: string;
  fr_bis?: string;
  sa_von?: string;
  sa_bis?: string;
  so_von?: string;
  so_bis?: string;
  created_at: string;
  last_update?: string;
}

export type ProfileSortField = "email" | "nachname" | "vorname" | "rollen_id";
export type SortDirection = "asc" | "desc";

export interface ProfileQueryParams {
  search?: string;
  filterRollenId?: number;
  sortField?: ProfileSortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface ProfileQueryResult {
  data: Profile[];
  totalCount: number;
}
