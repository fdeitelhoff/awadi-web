"use server";

import { getTickets } from "@/lib/data/tickets";
import { createClient } from "@/lib/supabase/server";
import type { TicketQueryParams, TicketQueryResult } from "@/lib/types/ticket";

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
