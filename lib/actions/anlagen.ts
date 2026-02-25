"use server";

import { createClient } from "@/lib/supabase/server";
import { getAnlagen } from "@/lib/data/anlagen";
import type { AnlageQueryParams, AnlageQueryResult } from "@/lib/types/anlage";

export interface CreateAnlageInput {
  // id is auto-assigned server-side (max + 1)
  kunden_id: number;
  ist_aktiv?: boolean;
  anlagen_nr?: string;
  bezeichnung?: string;
  verfahren_br_anz_behaelter?: number;
  strasse?: string;
  hausnr?: string;
  laenderkennung?: string;
  plz?: string;
  ort?: string;
  ortsteil?: string;
  gemarkung?: string;
  flur?: string;
  flurstueck?: string;
  anlage_ausgelegt_ew?: number;
  tatsaechliche_ew?: number;
  datum_naechste_wartung?: string;
  datum_abgabefrei_seit?: string;
  touren_nr?: string;
  touren_nr2?: string;
  touren_nr3?: string;
  export_erlaubt_wartung?: boolean;
  wartungsvertrag_flag?: number;
  datum_wartungsvertrag?: string;
  ansprechpartner_legacy?: string;
  telefonnr_legacy?: string;
  comment?: string;
  anmerkungen_gesamt?: string;
}

export async function createAnlage(
  input: CreateAnlageInput
): Promise<{ success: boolean; id?: number; error?: string }> {
  const supabase = await createClient();

  // Determine the next ID (anlagen.id is not auto-generated)
  const { data: maxRow } = await supabase
    .from("anlagen")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  const newId = (maxRow?.id ?? 0) + 1;

  const row: Record<string, unknown> = {
    id: newId,
    kunden_id: input.kunden_id,
    ist_aktiv: input.ist_aktiv ?? true,
    export_erlaubt_wartung: input.export_erlaubt_wartung ?? true,
  };

  const textFields: (keyof CreateAnlageInput)[] = [
    "anlagen_nr",
    "bezeichnung",
    "strasse",
    "hausnr",
    "laenderkennung",
    "plz",
    "ort",
    "ortsteil",
    "gemarkung",
    "flur",
    "flurstueck",
    "datum_naechste_wartung",
    "datum_abgabefrei_seit",
    "touren_nr",
    "touren_nr2",
    "touren_nr3",
    "datum_wartungsvertrag",
    "ansprechpartner_legacy",
    "telefonnr_legacy",
    "comment",
    "anmerkungen_gesamt",
  ];

  for (const field of textFields) {
    const value = input[field];
    if (typeof value === "string" && value.trim() !== "") {
      row[field] = value.trim();
    }
  }

  const numericFields: (keyof CreateAnlageInput)[] = [
    "verfahren_br_anz_behaelter",
    "anlage_ausgelegt_ew",
    "tatsaechliche_ew",
    "wartungsvertrag_flag",
  ];

  for (const field of numericFields) {
    const value = input[field];
    if (typeof value === "number") {
      row[field] = value;
    }
  }

  const { error } = await supabase.from("anlagen").insert(row);

  if (error) {
    console.error("Error creating anlage:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: newId };
}

export interface UpdateAnlageInput {
  kunden_id?: number;
  ist_aktiv?: boolean;
  anlagen_nr?: string;
  bezeichnung?: string;
  verfahren_br_anz_behaelter?: number | null;
  strasse?: string;
  hausnr?: string;
  laenderkennung?: string;
  plz?: string;
  ort?: string;
  ortsteil?: string;
  gemarkung?: string;
  flur?: string;
  flurstueck?: string;
  anlage_ausgelegt_ew?: number | null;
  tatsaechliche_ew?: number | null;
  touren_nr?: string;
  touren_nr2?: string;
  touren_nr3?: string;
  datum_naechste_wartung?: string;
  datum_abgabefrei_seit?: string;
  wartungsvertrag_flag?: number | null;
  datum_wartungsvertrag?: string;
  export_erlaubt_wartung?: boolean;
  ansprechpartner_legacy?: string;
  telefonnr_legacy?: string;
  comment?: string;
  anmerkungen_gesamt?: string;
}

export async function updateAnlage(
  id: number,
  input: UpdateAnlageInput
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
    } else if (typeof value === "string" && value !== undefined) {
      row[key] = value.trim() === "" ? null : value.trim();
    }
  }

  const { error } = await supabase.from("anlagen").update(row).eq("id", id);

  if (error) {
    console.error("Error updating anlage:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteAnlage(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("anlagen").delete().eq("id", id);

  if (error) {
    console.error("Error deleting anlage:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function fetchAnlagen(
  params: AnlageQueryParams = {}
): Promise<AnlageQueryResult> {
  return getAnlagen(params);
}
