"use server";

import { createClient } from "@/lib/supabase/server";
import { mapRowToAbwesenheit } from "@/lib/data/abwesenheiten";
import type { Abwesenheit } from "@/lib/types/abwesenheit";

export interface AbwesenheitInput {
  typ: string;
  von: string;
  bis: string;
  bemerkung?: string;
}

export async function createAbwesenheit(
  userId: string,
  input: AbwesenheitInput
): Promise<{ success: boolean; abwesenheit?: Abwesenheit; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_abwesenheiten")
    .insert({
      user_id: userId,
      typ: input.typ,
      von: input.von,
      bis: input.bis,
      bemerkung: input.bemerkung?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating absence:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    abwesenheit: mapRowToAbwesenheit(data as Record<string, unknown>),
  };
}

export async function updateAbwesenheit(
  id: number,
  input: AbwesenheitInput
): Promise<{ success: boolean; abwesenheit?: Abwesenheit; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_abwesenheiten")
    .update({
      typ: input.typ,
      von: input.von,
      bis: input.bis,
      bemerkung: input.bemerkung?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating absence:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    abwesenheit: mapRowToAbwesenheit(data as Record<string, unknown>),
  };
}

export async function deleteAbwesenheit(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("user_abwesenheiten")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting absence:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
