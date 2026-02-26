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
  rechtswert?: string;
  hochwert?: string;
  breitengrad?: string;
  laengengrad?: string;
  anlage_ausgelegt_ew?: number;
  tatsaechliche_ew?: number;
  gesamtgroesse_vk?: number;
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
    "gesamtgroesse_vk",
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
  if (input.anl_typ_id != null) {
    bioRow.anl_typ_id = input.anl_typ_id;
  }

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
  rechtswert?: string;
  hochwert?: string;
  breitengrad?: string;
  laengengrad?: string;
  anlage_ausgelegt_ew?: number | null;
  tatsaechliche_ew?: number | null;
  gesamtgroesse_vk?: number | null;
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

  // Separate anl_typ_id (lives on anl_biologien) from the rest
  const { anl_typ_id, ...anlageFields } = input;

  const row: Record<string, unknown> = {
    last_update: new Date().toISOString(),
  };

  for (const [key, value] of Object.entries(anlageFields)) {
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

  // Update the type on the first active biology if anl_typ_id was provided
  if (anl_typ_id !== undefined) {
    // Find the first active biology for this facility
    const { data: bioRow } = await supabase
      .from("anl_biologien")
      .select("id")
      .eq("anlage_id", id)
      .eq("vorhanden", true)
      .order("bio_nummer")
      .limit(1)
      .single();

    if (bioRow) {
      const { error: bioError } = await supabase
        .from("anl_biologien")
        .update({ anl_typ_id: anl_typ_id })
        .eq("id", bioRow.id);

      if (bioError) {
        console.error("Error updating anl_biologie type:", bioError);
        return { success: false, error: bioError.message };
      }
    }
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
