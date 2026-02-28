import { createClient } from "@/lib/supabase/server";
import type { InternalComment } from "@/lib/types/kommentar";

export function mapRowToComment(row: Record<string, unknown>): InternalComment {
  return {
    id: row.id as number,
    ref_table: row.ref_table as string,
    ref_id: String(row.ref_id),
    kommentar: row.kommentar as string,
    user_id: row.user_id as string | undefined,
    user_name: row.user_name as string | undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string | undefined,
  };
}

export async function getInternalComments(
  refTable: string,
  refId: number | string
): Promise<InternalComment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("interne_anmerkungen")
    .select("*")
    .eq("ref_table", refTable)
    .eq("ref_id", String(refId))
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching internal comments:", error);
    return [];
  }

  return (data ?? []).map(mapRowToComment);
}
