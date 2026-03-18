"use server";

import { getTickets } from "@/lib/data/tickets";
import { createClient } from "@/lib/supabase/server";
import type {
  TicketQueryParams,
  TicketQueryResult,
  TicketStatus,
  TicketPriorität,
} from "@/lib/types/ticket";

export interface CreateTicketInput {
  titel: string;
  beschreibung?: string;
  status?: TicketStatus;
  prioritaet?: TicketPriorität;
  kunden_id?: number;
  anlage_id?: number;
  anlage_name?: string;
  vorname?: string;
  nachname?: string;
  email?: string;
  telefonnr?: string;
  strasse?: string;
  hausnr?: string;
  plz?: string;
  ort?: string;
  user_id?: string;   // undefined = not assigned
  user_name?: string; // undefined = not assigned
}

export interface UpdateTicketInput extends Omit<Partial<CreateTicketInput>, "user_id" | "user_name"> {
  user_id?: string | null;   // null = explicitly clear the technician assignment
  user_name?: string | null; // null = explicitly clear the technician name
}

export interface KundeContactData {
  nachname?: string;
  vorname?: string;
  email?: string;
  telefonnr?: string;
  strasse?: string;
  hausnr?: string;
  plz?: string;
  ort?: string;
}

export async function createTicket(
  input: CreateTicketInput
): Promise<{ success: boolean; id?: number; error?: string }> {
  const supabase = await createClient();

  const row: Record<string, unknown> = {
    status: input.status ?? "offen",
    prioritaet: input.prioritaet ?? "normal",
  };

  // titel is required
  row.titel = input.titel.trim();

  // Optional fields: store non-empty strings, skip empty strings
  const stringFields: (keyof CreateTicketInput)[] = [
    "beschreibung", "anlage_name", "vorname", "nachname", "email",
    "telefonnr", "strasse", "hausnr", "plz", "ort",
  ];
  for (const key of stringFields) {
    const val = input[key];
    if (typeof val === "string" && val.trim() !== "") {
      row[key] = val.trim();
    }
  }

  if (input.kunden_id != null) row.kunden_id = input.kunden_id;
  if (input.anlage_id != null) row.anlage_id = input.anlage_id;
  if (input.user_id != null) row.user_id = input.user_id;
  if (input.user_name != null) row.user_name = input.user_name;

  const { data, error } = await supabase
    .from("tickets")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("Error creating ticket:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

export async function updateTicket(
  id: number,
  input: UpdateTicketInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.titel !== undefined) row.titel = input.titel.trim();
  if (input.status !== undefined) row.status = input.status;
  if (input.prioritaet !== undefined) row.prioritaet = input.prioritaet;

  const stringFields: (keyof UpdateTicketInput)[] = [
    "beschreibung", "anlage_name", "vorname", "nachname", "email",
    "telefonnr", "strasse", "hausnr", "plz", "ort",
  ];
  for (const key of stringFields) {
    const val = input[key];
    if (val !== undefined) {
      // Store empty strings as NULL (same pattern as updateKunde)
      row[key] = typeof val === "string" && val.trim() === "" ? null : (val as string).trim();
    }
  }

  // FK fields: allow explicit null to clear
  if ("kunden_id" in input) row.kunden_id = input.kunden_id ?? null;
  if ("anlage_id" in input) row.anlage_id = input.anlage_id ?? null;

  // Techniker: user_id is a UUID (not a trimmed string). null = clear the assignment.
  if (input.user_id !== undefined) row.user_id = input.user_id ?? null;
  if (input.user_name !== undefined) row.user_name = input.user_name ?? null;

  const { error } = await supabase.from("tickets").update(row).eq("id", id);

  if (error) {
    console.error("Error updating ticket:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getKundeContactForTicket(
  kundenId: number
): Promise<KundeContactData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kunden")
    .select("nachname, vorname, email, telefonnr, strasse, hausnr, plz, ort")
    .eq("id", kundenId)
    .single();

  if (error || !data) return null;

  return {
    nachname: data.nachname ?? undefined,
    vorname: data.vorname ?? undefined,
    email: data.email ?? undefined,
    telefonnr: data.telefonnr ?? undefined,
    strasse: data.strasse ?? undefined,
    hausnr: data.hausnr ?? undefined,
    plz: data.plz ?? undefined,
    ort: data.ort ?? undefined,
  };
}

export async function fetchTickets(
  params: TicketQueryParams = {}
): Promise<TicketQueryResult> {
  return getTickets(params);
}

export async function deleteTicket(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("tickets").delete().eq("id", id);
  if (error) {
    return { success: false, error: "Ticket konnte nicht gelöscht werden." };
  }
  return { success: true };
}
