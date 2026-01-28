"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ServiceTicket } from "@/lib/types/maintenance";
import {
  Calendar,
  Mail,
  MapPin,
  Phone,
  Plus,
  Ticket,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PriorityBadge } from "./status-badge";

interface TicketsSidebarProps {
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

interface TicketCardProps {
  ticket: ServiceTicket;
  now: Date;
  onSchedule?: () => void;
}

function TicketCard({ ticket, now, onSchedule }: TicketCardProps) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors space-y-2.5">
      {/* Header with title and priority */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm leading-tight line-clamp-2">
          {ticket.title}
        </h4>
        <PriorityBadge priority={ticket.priority} />
      </div>

      {/* Contact info */}
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">{ticket.contactPerson}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{ticket.location}</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`tel:${ticket.phoneNumber}`}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Phone className="h-3 w-3" />
            <span>{ticket.phoneNumber}</span>
          </a>
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href={`mailto:${ticket.email}`}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Mail className="h-3 w-3" />
            <span className="truncate">{ticket.email}</span>
          </a>
        </div>
      </div>

      {/* Footer with date and action */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(ticket.createdAt, now)}
        </span>
        {onSchedule && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs gap-1"
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

export function TicketsSidebar({
  tickets,
  onScheduleTicket,
}: TicketsSidebarProps) {
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
      <Card className="w-80 shrink-0 flex flex-col min-h-0 overflow-hidden items-center justify-center">
        <div className="text-muted-foreground py-8">Laden...</div>
      </Card>
    );
  }

  return (
    <Card className="w-80 shrink-0 flex flex-col min-h-0 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Offene Tickets</CardTitle>
          </div>
          <span className="text-sm text-muted-foreground">
            {tickets.length}
          </span>
        </div>

        {/* Priority summary */}
        {(urgentCount > 0 || highCount > 0) && (
          <div className="flex gap-2 mt-2">
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
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 min-h-0 pt-3">
        <ScrollArea className="h-full">
          <div className="space-y-3 pr-3">
            {sortedTickets.length > 0 ? (
              sortedTickets.map((ticket) => (
                <TicketCard
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
              <div className="text-center py-8 text-muted-foreground">
                <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Keine offenen Tickets</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <Separator />

      <div className="p-3">
        <Button variant="outline" className="w-full gap-2" size="sm">
          <Plus className="h-4 w-4" />
          Neues Ticket erstellen
        </Button>
      </div>
    </Card>
  );
}
