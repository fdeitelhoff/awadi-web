"use server";

import { createClient } from "@/lib/supabase/server";
import type { KontaktFormData } from "@/lib/types/kontakt";

const TEXT_FIELDS: (keyof KontaktFormData)[] = [
  "firma",
  "nachname",
  "vorname",
  "titel",
  "anrede",
  "strasse",
  "hausnr",
  "laenderkennung",
  "plz",
  "ort",
  "ortsteil",
  "telefonnr",
  "mobilnr",
  "email",
  "anmerkungen",
];

export async function createKontakt(
  data: KontaktFormData
): Promise<{ success: boolean; id?: number; error?: string }> {
  const supabase = await createClient();

  const row: Record<string, unknown> = {};
  for (const field of TEXT_FIELDS) {
    const value = data[field];
    if (typeof value === "string" && value.trim() !== "") {
      row[field] = value.trim();
    }
  }

  const { data: inserted, error } = await supabase
    .from("kontakte")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("Error creating kontakt:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: (inserted as { id: number }).id };
}

export async function updateKontakt(
  id: number,
  data: KontaktFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const row: Record<string, unknown> = {
    last_update: new Date().toISOString(),
  };

  for (const field of TEXT_FIELDS) {
    const value = data[field];
    if (typeof value === "string") {
      row[field] = value.trim() === "" ? null : value.trim();
    }
  }

  const { error } = await supabase.from("kontakte").update(row).eq("id", id);

  if (error) {
    console.error("Error updating kontakt:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
