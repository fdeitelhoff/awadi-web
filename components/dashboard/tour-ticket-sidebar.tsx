// components/dashboard/tour-ticket-sidebar.tsx
"use client";

import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Ticket } from "@/lib/types/ticket";

interface Props {
  tickets: Ticket[];
  onDismiss?: (ticketId: number) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  dringend: "destructive",
  hoch: "outline",
  normal: "secondary",
};

export function TourTicketSidebar({ tickets, onDismiss }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: "ticket-sidebar" });

  return (
    <div
      ref={setNodeRef}
      className={`w-64 shrink-0 flex flex-col border rounded-lg ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">Offene Tickets</h3>
        <p className="text-xs text-muted-foreground">{tickets.length} Ticket(s)</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {tickets.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Alle Tickets eingeplant</p>
          )}
          {tickets.map(ticket => (
            <Card key={ticket.id} className="text-xs cursor-grab active:cursor-grabbing border-l-2 border-l-red-500">
              <CardContent className="p-2 space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-medium truncate">{ticket.titel}</span>
                  <Badge
                    variant={PRIORITY_COLORS[ticket.prioritaet] as "destructive" | "outline" | "secondary"}
                    className="h-4 text-[10px] shrink-0"
                  >
                    {ticket.prioritaet}
                  </Badge>
                </div>
                {ticket.strasse && (
                  <div className="text-muted-foreground truncate">
                    {ticket.strasse} {ticket.hausnr}, {ticket.ort}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
