import type { Ticket, TicketPriorität } from "@/lib/types/ticket";

export const PRIORITY_ORDER: Record<TicketPriorität, number> = {
  dringend: 0,
  hoch: 1,
  normal: 2,
};

/** Resolve which technician should handle a ticket.
 *  Priority: ticket.techniker_id → anlage.techniker_id → geo-nearest available */
export function resolveTicketTechnician(
  ticket: Ticket,
  anlageToTechMap: Record<number, string>,
  availableTechIds: string[]
): string | null {
  if (ticket.techniker_id) return ticket.techniker_id;
  if (ticket.anlage_id != null && anlageToTechMap[ticket.anlage_id]) {
    return anlageToTechMap[ticket.anlage_id]!;
  }
  return availableTechIds[0] ?? null;
}

/** Sort tickets by priority (dringend first) then created_at (oldest first). */
export function sortTicketsByPriority(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => {
    const pd = PRIORITY_ORDER[a.prioritaet] - PRIORITY_ORDER[b.prioritaet];
    if (pd !== 0) return pd;
    return a.created_at.localeCompare(b.created_at);
  });
}
