"use server";

import { createClient } from "@/lib/supabase/server";

export type UpdateOwnProfileInput = {
  vorname?: string;
  nachname?: string;
  telefonnr?: string;
  farbe?: string;
};

export async function updateOwnProfile(
  input: UpdateOwnProfileInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Nicht authentifiziert." };

  const { error } = await supabase
    .from("profiles")
    .update({ ...input, last_update: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateOwnPassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
