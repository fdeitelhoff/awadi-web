import { createClient } from "@/lib/supabase/server";
import type { Abwesenheit } from "@/lib/types/abwesenheit";

export function mapRowToAbwesenheit(row: Record<string, unknown>): Abwesenheit {
  return {
    id: row.id as number,
    user_id: row.user_id as string,
    typ: row.typ as string,
    von: row.von as string,
    bis: row.bis as string,
    bemerkung: row.bemerkung as string | undefined,
    created_at: row.created_at as string,
  };
}

export async function getAbwesenheiten(userId: string): Promise<Abwesenheit[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_abwesenheiten")
    .select("*")
    .eq("user_id", userId)
    .order("von", { ascending: true });

  if (error) {
    console.error("Error fetching absences:", error);
    return [];
  }

  return (data ?? []).map(mapRowToAbwesenheit);
}
