"use server";

import { createClient } from "@/lib/supabase/server";
import { mapRowToComment } from "@/lib/data/kommentare";
import type { InternalComment } from "@/lib/types/kommentar";

export async function createInternalComment(
  refTable: string,
  refId: number | string,
  kommentar: string
): Promise<{ success: boolean; comment?: InternalComment; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("interne_anmerkungen")
    .insert({
      ref_table: refTable,
      ref_id: String(refId),
      kommentar: kommentar.trim(),
      user_id: user?.id ?? null,
      user_name:
        user?.user_metadata?.full_name ?? user?.email ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating comment:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    comment: mapRowToComment(data as Record<string, unknown>),
  };
}

export async function updateInternalComment(
  id: number,
  kommentar: string
): Promise<{ success: boolean; comment?: InternalComment; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("interne_anmerkungen")
    .update({
      kommentar: kommentar.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating comment:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    comment: mapRowToComment(data as Record<string, unknown>),
  };
}

export async function deleteInternalComment(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("interne_anmerkungen")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting comment:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
