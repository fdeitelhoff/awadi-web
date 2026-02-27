"use server";

import { createClient } from "@/lib/supabase/server";
import { getCustomers } from "@/lib/data/customers";
import type { KundeQueryParams, KundeQueryResult } from "@/lib/types/customer";

export interface CreateKundeInput {
  kundennr?: string;
  anrede?: string;
  titel?: string;
  vorname?: string;
  nachname?: string;
  firma?: string;
  strasse?: string;
  hausnr?: string;
  laenderkennung?: string;
  plz?: string;
  ort?: string;
  ortsteil?: string;
  telefonnr?: string;
  telefonnr_geschaeft?: string;
  mobilnr?: string;
  mobilnr2?: string;
  email?: string;
  email_secondary?: string;
  homepage?: string;
  interne_anmerkungen?: string;
}

export async function createKunde(
  input: CreateKundeInput
): Promise<{ success: boolean; id?: number; error?: string }> {
  const supabase = await createClient();

  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "boolean") {
      row[key] = value;
    } else if (typeof value === "string" && value.trim() !== "") {
      row[key] = value.trim();
    }
  }
  const { data, error } = await supabase
    .from("kunden")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("Error creating kunde:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

export interface UpdateKundeInput {
  kundennr?: string;
  anrede?: string;
  titel?: string;
  vorname?: string;
  nachname?: string;
  firma?: string;
  strasse?: string;
  hausnr?: string;
  laenderkennung?: string;
  plz?: string;
  ort?: string;
  ortsteil?: string;
  telefonnr?: string;
  telefonnr_geschaeft?: string;
  mobilnr?: string;
  mobilnr2?: string;
  email?: string;
  email_secondary?: string;
  homepage?: string;
  interne_anmerkungen?: string;
}

export async function updateKunde(
  id: number,
  input: UpdateKundeInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const row: Record<string, unknown> = {
    last_update: new Date().toISOString(),
  };

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "boolean") {
      row[key] = value;
    } else if (value !== undefined) {
      // Store empty strings as NULL
      row[key] = value.trim() === "" ? null : value.trim();
    }
  }

  const { error } = await supabase.from("kunden").update(row).eq("id", id);

  if (error) {
    console.error("Error updating kunde:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteKunde(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("kunden").delete().eq("id", id);

  if (error) {
    console.error("Error deleting kunde:", error);
    // Supabase returns a foreign-key violation (23503) when anlagen still reference this kunde
    const userMessage =
      error.code === "23503"
        ? "Der Kunde kann nicht gelöscht werden, da noch Anlagen zugeordnet sind."
        : error.message;
    return { success: false, error: userMessage };
  }

  return { success: true };
}

export async function fetchCustomers(
  params: KundeQueryParams = {}
): Promise<KundeQueryResult> {
  return getCustomers(params);
}
