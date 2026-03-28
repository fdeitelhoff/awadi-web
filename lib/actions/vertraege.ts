"use server";

import { createClient } from "@/lib/supabase/server";
import { getVertraege } from "@/lib/data/vertraege";
import type { VertragQueryParams, VertragQueryResult } from "@/lib/types/vertrag";

export interface CreateVertragInput {
  anlage_id: number;
  kunden_id?: number | null;
  gueltig_ab?: string;
  gueltig_bis?: string;
  anl_typ_id?: number | null;
  intervall_monate?: number;
  dauer_wartung_minuten?: number;
  datum_naechste_wartung?: string;
  datum_letzte_wartung?: string;
}

export interface UpdateVertragInput {
  anlage_id?: number;
  kunden_id?: number | null;
  gueltig_ab?: string;
  gueltig_bis?: string;
  anl_typ_id?: number | null;
  intervall_monate?: number | null;
  dauer_wartung_minuten?: number | null;
  datum_naechste_wartung?: string;
  datum_letzte_wartung?: string;
}

export async function createVertrag(
  input: CreateVertragInput
): Promise<{ success: boolean; id?: number; error?: string }> {
  const supabase = await createClient();

  const row: Record<string, unknown> = {
    anlage_id: input.anlage_id,
  };

  if (input.kunden_id != null) row.kunden_id = input.kunden_id;
  if (input.anl_typ_id != null) row.anl_typ_id = input.anl_typ_id;

  const textFields: (keyof CreateVertragInput)[] = [
    "gueltig_ab",
    "gueltig_bis",
    "datum_naechste_wartung",
    "datum_letzte_wartung",
  ];
  for (const field of textFields) {
    const value = input[field];
    if (typeof value === "string" && value.trim() !== "") {
      row[field] = value.trim();
    }
  }

  if (typeof input.intervall_monate === "number") {
    row.intervall_monate = input.intervall_monate;
  }

  if (typeof input.dauer_wartung_minuten === "number") {
    row.dauer_wartung_minuten = input.dauer_wartung_minuten;
  }

  const { data, error } = await supabase
    .from("wartungsvertraege")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("Error creating vertrag:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: (data as { id: number }).id };
}

export async function updateVertrag(
  id: number,
  input: UpdateVertragInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const row: Record<string, unknown> = {
    last_update: new Date().toISOString(),
  };

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "boolean") {
      row[key] = value;
    } else if (typeof value === "number") {
      row[key] = value;
    } else if (value === null) {
      row[key] = null;
    } else if (typeof value === "string") {
      row[key] = value.trim() === "" ? null : value.trim();
    }
  }

  const { error } = await supabase
    .from("wartungsvertraege")
    .update(row)
    .eq("id", id);

  if (error) {
    console.error("Error updating vertrag:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteVertrag(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("wartungsvertraege")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting vertrag:", error);
    if (error.code === "23503") {
      return {
        success: false,
        error: "Dieser Vertrag kann nicht gelöscht werden, da er noch verwendet wird.",
      };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function fetchVertraege(
  params: VertragQueryParams = {}
): Promise<VertragQueryResult> {
  return getVertraege(params);
}
