"use server";

import { createClient } from "@/lib/supabase/server";
import { getAnlTypenFull } from "@/lib/data/anl-typen";
import type { AnlTypQueryParams, AnlTypQueryResult } from "@/lib/types/anl-typ";

export interface CreateAnlTypInput {
  // id is auto-assigned server-side (max + 1)
  sortiernr?: number;
  bezeichnung: string;
  bio_felder?: string;
  preis_je_wartung?: number;
  preis_je_kontrolle?: number;
  wartungsintervall_monate?: number;
  dauer_wartung_minuten?: number;
  dauer_kontrolle_minuten?: number;
}

export interface UpdateAnlTypInput {
  sortiernr?: number | null;
  bezeichnung?: string;
  bio_felder?: string;
  preis_je_wartung?: number;
  preis_je_kontrolle?: number;
  wartungsintervall_monate?: number;
  dauer_wartung_minuten?: number;
  dauer_kontrolle_minuten?: number | null;
}

export async function createAnlTyp(
  input: CreateAnlTypInput
): Promise<{ success: boolean; id?: number; error?: string }> {
  const supabase = await createClient();

  // Determine next ID (anl_typen.id is not auto-generated)
  const { data: maxRow } = await supabase
    .from("anl_typen")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  const newId = (maxRow?.id ?? 0) + 1;

  const row: Record<string, unknown> = {
    id: newId,
    bezeichnung: input.bezeichnung.trim(),
    preis_je_wartung: input.preis_je_wartung ?? 0,
    preis_je_kontrolle: input.preis_je_kontrolle ?? 0,
    wartungsintervall_monate: input.wartungsintervall_monate ?? 12,
    dauer_wartung_minuten: input.dauer_wartung_minuten ?? 60,
  };

  if (input.sortiernr != null) row.sortiernr = input.sortiernr;
  if (input.bio_felder?.trim()) row.bio_felder = input.bio_felder.trim();
  if (input.dauer_kontrolle_minuten != null)
    row.dauer_kontrolle_minuten = input.dauer_kontrolle_minuten;

  const { error } = await supabase.from("anl_typen").insert(row);

  if (error) {
    console.error("Error creating anl_typ:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: newId };
}

export async function updateAnlTyp(
  id: number,
  input: UpdateAnlTypInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const row: Record<string, unknown> = {
    last_update: new Date().toISOString(),
  };

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "number") {
      row[key] = value;
    } else if (value === null) {
      row[key] = null;
    } else if (typeof value === "string") {
      row[key] = value.trim() === "" ? null : value.trim();
    }
  }

  const { error } = await supabase.from("anl_typen").update(row).eq("id", id);

  if (error) {
    console.error("Error updating anl_typ:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteAnlTyp(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("anl_typen").delete().eq("id", id);

  if (error) {
    console.error("Error deleting anl_typ:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function fetchAnlTypen(
  params: AnlTypQueryParams = {}
): Promise<AnlTypQueryResult> {
  return getAnlTypenFull(params);
}
