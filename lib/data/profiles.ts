import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  ProfileQueryParams,
  ProfileQueryResult,
} from "@/lib/types/profile";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToProfile(row: any): Profile {
  return {
    id: row.id as string,
    email: row.email as string,
    vorname: row.vorname as string | undefined,
    nachname: row.nachname as string | undefined,
    rolle: row.rolle as "techniker" | "disponent",
    telefonnr: row.telefonnr as string | undefined,
    aktiv: row.aktiv as boolean,
    farbe: row.farbe as string | undefined,
    mo_von: row.mo_von as string | undefined,
    mo_bis: row.mo_bis as string | undefined,
    di_von: row.di_von as string | undefined,
    di_bis: row.di_bis as string | undefined,
    mi_von: row.mi_von as string | undefined,
    mi_bis: row.mi_bis as string | undefined,
    do_von: row.do_von as string | undefined,
    do_bis: row.do_bis as string | undefined,
    fr_von: row.fr_von as string | undefined,
    fr_bis: row.fr_bis as string | undefined,
    sa_von: row.sa_von as string | undefined,
    sa_bis: row.sa_bis as string | undefined,
    so_von: row.so_von as string | undefined,
    so_bis: row.so_bis as string | undefined,
    created_at: row.created_at as string,
    last_update: row.last_update as string | undefined,
  };
}

export async function getProfiles(
  params: ProfileQueryParams = {}
): Promise<ProfileQueryResult> {
  const supabase = await createClient();
  const {
    search = "",
    filterRolle = "all",
    sortField = "nachname",
    sortDirection = "asc",
    page = 1,
    pageSize = 14,
  } = params;

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" });

  if (search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(
      `email.ilike.${term},vorname.ilike.${term},nachname.ilike.${term}`
    );
  }

  if (filterRolle !== "all") {
    query = query.eq("rolle", filterRolle);
  }

  query = query
    .order(sortField, { ascending: sortDirection === "asc" })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []).map(mapRowToProfile),
    totalCount: count ?? 0,
  };
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return mapRowToProfile(data);
}
