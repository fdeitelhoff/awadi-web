"use server";

import { createClient } from "@/lib/supabase/server";
import { getAnlagen } from "@/lib/data/anlagen";
import type { AnlageQueryParams, AnlageQueryResult } from "@/lib/types/anlage";

export interface CreateAnlageInput {
  // id is auto-assigned server-side (max + 1)
  kunden_id: number;
  anl_typ_id?: number;
  kontakt_kunde_id?: number;
  kontakt_id?: number;
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
  rechtswert?: string;
  hochwert?: string;
  breitengrad?: string;
  laengengrad?: string;
  anlage_ausgelegt_ew?: number;
  tatsaechliche_ew?: number;
  gesamtgroesse_vk?: number;
  cleaning_class?: string;
  oxygen_demand_class?: string;
  discharged_in?: string;
  number_of_biologies?: number;
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
  };

  if (input.anl_typ_id != null) {
    row.anl_typ_id = input.anl_typ_id;
  }

  // XOR: at most one of kontakt_kunde_id / kontakt_id
  if (input.kontakt_kunde_id != null) {
    row.kontakt_kunde_id = input.kontakt_kunde_id;
  } else if (input.kontakt_id != null) {
    row.kontakt_id = input.kontakt_id;
  }

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
    "rechtswert",
    "hochwert",
    "breitengrad",
    "laengengrad",
    "cleaning_class",
    "oxygen_demand_class",
    "discharged_in",
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
    "gesamtgroesse_vk",
    "number_of_biologies",
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

  // Always create the first biology record so every facility has a type slot
  const { data: maxBioRow } = await supabase
    .from("anl_biologien")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  const newBioId = (maxBioRow?.id ?? 0) + 1;

  const bioRow: Record<string, unknown> = {
    id: newBioId,
    anlage_id: newId,
    bio_nummer: 1,
    vorhanden: true,
  };

  const { error: bioError } = await supabase
    .from("anl_biologien")
    .insert(bioRow);

  if (bioError) {
    console.error("Error creating anl_biologie:", bioError);
    // Anlage was created successfully; biology failure is non-fatal but logged
  }

  return { success: true, id: newId };
}

export interface UpdateAnlageInput {
  anl_typ_id?: number | null;
  kunden_id?: number;
  kontakt_kunde_id?: number | null;
  kontakt_id?: number | null;
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
  rechtswert?: string;
  hochwert?: string;
  breitengrad?: string;
  laengengrad?: string;
  anlage_ausgelegt_ew?: number | null;
  tatsaechliche_ew?: number | null;
  gesamtgroesse_vk?: number | null;
  cleaning_class?: string;
  oxygen_demand_class?: string;
  discharged_in?: string;
  number_of_biologies?: number | null;
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
    } else if (typeof value === "string") {
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
