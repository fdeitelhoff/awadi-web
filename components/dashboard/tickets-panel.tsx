"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ServiceTicket } from "@/lib/types/maintenance";
import {
  Calendar,
  MapPin,
  Phone,
  Plus,
  Ticket,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PriorityBadge } from "./status-badge";

interface TicketsPanelProps {
  tickets: ServiceTicket[];
  onScheduleTicket?: (ticketId: string) => void;
}

function formatRelativeDate(date: Date, now: Date): string {
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Heute";
  if (diffDays === 1) return "Gestern";
  if (diffDays < 7) return `Vor ${diffDays} Tagen`;
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
}

interface CompactTicketCardProps {
  ticket: ServiceTicket;
  now: Date;
  onSchedule?: () => void;
}

function CompactTicketCard({ ticket, now, onSchedule }: CompactTicketCardProps) {
  return (
    <div className="w-64 shrink-0 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors space-y-2">
      {/* Header with title and priority */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm leading-tight line-clamp-1">
          {ticket.title}
        </h4>
        <PriorityBadge priority={ticket.priority} />
      </div>

      {/* Contact info - compact */}
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">{ticket.contactPerson}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{ticket.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="h-3 w-3 shrink-0" />
          <span>{ticket.phoneNumber}</span>
        </div>
      </div>

      {/* Footer with date and action */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-muted-foreground">
          {formatRelativeDate(ticket.createdAt, now)}
        </span>
        {onSchedule && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs gap-1"
            onClick={onSchedule}
          >
            <Calendar className="h-3 w-3" />
            Einplanen
          </Button>
        )}
      </div>
    </div>
  );
}

export function TicketsPanel({
  tickets,
  onScheduleTicket,
}: TicketsPanelProps) {
  const [now, setNow] = useState<Date | null>(null);

  // Initialize date on client side to avoid SSR/prerender issues
  useEffect(() => {
    setNow(new Date());
  }, []);

  // Sort tickets by priority and date
  const sortedTickets = [...tickets].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const urgentCount = tickets.filter((t) => t.priority === "urgent").length;
  const highCount = tickets.filter((t) => t.priority === "high").length;

  // Show loading state during SSR
  if (now === null) {
    return (
      <Card className="shrink-0 h-44">
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Laden...
        </div>
      </Card>
    );
  }

  return (
    <Card className="shrink-0">
      <CardHeader className="py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Offene Tickets</CardTitle>
              <span className="text-sm text-muted-foreground">
                ({tickets.length})
              </span>
            </div>

            {/* Priority summary */}
            {(urgentCount > 0 || highCount > 0) && (
              <div className="flex gap-2">
                {urgentCount > 0 && (
                  <span className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded">
                    {urgentCount} dringend
                  </span>
                )}
                {highCount > 0 && (
                  <span className="text-xs bg-warning/15 text-warning px-2 py-0.5 rounded">
                    {highCount} hoch
                  </span>
                )}
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" className="gap-1.5 h-7">
            <Plus className="h-3.5 w-3.5" />
            Neues Ticket
          </Button>
        </div>
      </CardHeader>

      <CardContent className="py-2 px-4">
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-3">
            {sortedTickets.length > 0 ? (
              sortedTickets.map((ticket) => (
                <CompactTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  now={now}
                  onSchedule={
                    onScheduleTicket
                      ? () => onScheduleTicket(ticket.id)
                      : undefined
                  }
                />
              ))
            ) : (
              <div className="w-full text-center py-4 text-muted-foreground">
                <Ticket className="h-6 w-6 mx-auto mb-1 opacity-50" />
                <p className="text-sm">Keine offenen Tickets</p>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
