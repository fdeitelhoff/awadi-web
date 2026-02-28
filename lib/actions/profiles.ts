"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ProfileQueryParams,
  ProfileQueryResult,
} from "@/lib/types/profile";
import { getProfiles } from "@/lib/data/profiles";

export async function fetchProfiles(
  params: ProfileQueryParams
): Promise<ProfileQueryResult> {
  return getProfiles(params);
}

export async function deleteProfile(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { success: false, error: "Dieser Benutzer kann nicht gelöscht werden, da er noch in anderen Datensätzen verwendet wird." };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}

export type UpdateProfileInput = {
  vorname?: string;
  nachname?: string;
  rollen_id: number;
  telefonnr?: string;
  aktiv: boolean;
  farbe?: string;
  mo_von?: string | null;
  mo_bis?: string | null;
  di_von?: string | null;
  di_bis?: string | null;
  mi_von?: string | null;
  mi_bis?: string | null;
  do_von?: string | null;
  do_bis?: string | null;
  fr_von?: string | null;
  fr_bis?: string | null;
  sa_von?: string | null;
  sa_bis?: string | null;
  so_von?: string | null;
  so_bis?: string | null;
};

export type InviteUserInput = {
  email: string;
} & UpdateProfileInput;

export async function inviteUser(
  input: InviteUserInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
    data: { rollen_id: input.rollen_id },
  });

  if (error) return { success: false, error: error.message };

  const userId = data.user.id;

  // Update the auto-created profile with all provided fields
  const { email: _email, ...profileFields } = input;
  await admin
    .from("profiles")
    .update({ ...profileFields, last_update: new Date().toISOString() })
    .eq("id", userId);

  return { success: true, id: userId };
}

export async function updateProfile(
  id: string,
  input: UpdateProfileInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ ...input, last_update: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
