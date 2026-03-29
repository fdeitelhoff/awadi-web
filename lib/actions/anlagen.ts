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
  breitengrad?: string;
  laengengrad?: string;
  anlage_ausgelegt_ew?: number;
  tatsaechliche_ew?: number;
  gesamtgroesse_vk?: number;
  groesse_vk1?: number;
  groesse_vk2?: number;
  groesse_vk3?: number;
  groesse_vk4?: number;
  cleaning_class?: string;
  oxygen_demand_class?: string;
  discharged_in?: string;
  number_of_biologies?: number;
  hersteller?: string;
  typ?: string;
  techniker_id?: string;
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

  if (input.techniker_id != null) {
    row.techniker_id = input.techniker_id;
  }

  // XOR: at most one of kontakt_kunde_id / kontakt_id
  if (input.kontakt_kunde_id != null) {
    row.kontakt_kunde_id = input.kontakt_kunde_id;
  } else if (input.kontakt_id != null) {
    row.kontakt_id = input.kontakt_id;
  }

  const textFields: (keyof CreateAnlageInput)[] = [
    "anlagen_nr",
    "strasse",
    "hausnr",
    "laenderkennung",
    "plz",
    "ort",
    "ortsteil",
    "gemarkung",
    "flur",
    "flurstueck",
    "breitengrad",
    "laengengrad",
    "cleaning_class",
    "oxygen_demand_class",
    "discharged_in",
    "hersteller",
    "typ",
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
    "groesse_vk1",
    "groesse_vk2",
    "groesse_vk3",
    "groesse_vk4",
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

  return { success: true, id: newId };
}

export interface UpdateAnlageInput {
  anl_typ_id?: number | null;
  kunden_id?: number;
  kontakt_kunde_id?: number | null;
  kontakt_id?: number | null;
  anlagen_nr?: string;
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
  breitengrad?: string;
  laengengrad?: string;
  anlage_ausgelegt_ew?: number | null;
  tatsaechliche_ew?: number | null;
  gesamtgroesse_vk?: number | null;
  groesse_vk1?: number | null;
  groesse_vk2?: number | null;
  groesse_vk3?: number | null;
  groesse_vk4?: number | null;
  cleaning_class?: string;
  oxygen_demand_class?: string;
  discharged_in?: string;
  number_of_biologies?: number | null;
  hersteller?: string;
  typ?: string;
  techniker_id?: string | null;
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

export interface AnlagePickerResult {
  id: number;
  anlagen_nr?: string;
  anl_typ_bezeichnung?: string;
  kunden_id?: number;
  ort?: string;
}

export async function fetchAnlagenForPicker(
  search: string
): Promise<AnlagePickerResult[]> {
  const supabase = await createClient();

  let query = supabase
    .from("anlagen_details")
    .select("id, anlagen_nr, anl_typ_bezeichnung, kunden_id, ort")
    .order("anlagen_nr", { ascending: true })
    .limit(20);

  if (search.trim()) {
    const pattern = `%${search.trim()}%`;
    query = query.or(
      [
        `anlagen_nr.ilike.${pattern}`,
        `anl_typ_bezeichnung.ilike.${pattern}`,
        `ort.ilike.${pattern}`,
      ].join(",")
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching anlagen for picker:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as number,
    anlagen_nr: row.anlagen_nr as string | undefined,
    anl_typ_bezeichnung: row.anl_typ_bezeichnung as string | undefined,
    kunden_id: row.kunden_id as number | undefined,
    ort: row.ort as string | undefined,
  }));
}
