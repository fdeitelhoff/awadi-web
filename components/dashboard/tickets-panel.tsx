"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, Plus, Search, Ticket, User } from "lucide-react";
import { useState } from "react";
import { TicketPriorityBadge } from "./status-badge";
import type { TicketListItem } from "@/lib/types/ticket";

interface TicketsPanelProps {
  tickets: TicketListItem[];
}

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Heute";
  if (diffDays === 1) return "Gestern";
  if (diffDays < 7) return `Vor ${diffDays} Tagen`;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function contactName(ticket: TicketListItem): string {
  const name = [ticket.vorname, ticket.nachname].filter(Boolean).join(" ");
  return name || ticket.kunden_name || "—";
}

function formatLocation(ticket: TicketListItem): string {
  const street = [ticket.strasse, ticket.hausnr].filter(Boolean).join(" ");
  const city = [ticket.plz, ticket.ort].filter(Boolean).join(" ");
  return [street, city].filter(Boolean).join(", ") || "—";
}

function CompactTicketCard({ ticket }: { ticket: TicketListItem }) {
  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="w-64 shrink-0 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors space-y-2 block"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm leading-tight line-clamp-1">{ticket.titel}</h4>
        <TicketPriorityBadge prioritaet={ticket.prioritaet} />
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">{contactName(ticket)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{formatLocation(ticket)}</span>
        </div>
        {ticket.telefonnr && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{ticket.telefonnr}</span>
          </div>
        )}
      </div>

      <div className="pt-1">
        <span className="text-[10px] text-muted-foreground">
          {formatRelativeDate(ticket.created_at)}
        </span>
      </div>
    </Link>
  );
}

export function TicketsPanel({ tickets }: TicketsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Set<string>>(new Set());

  const togglePriority = (p: string) =>
    setPriorityFilter((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });

  const searchFilteredTickets = tickets.filter((ticket) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      ticket.titel.toLowerCase().includes(query) ||
      contactName(ticket).toLowerCase().includes(query) ||
      formatLocation(ticket).toLowerCase().includes(query) ||
      (ticket.telefonnr?.includes(query) ?? false) ||
      (ticket.email?.toLowerCase().includes(query) ?? false) ||
      (ticket.beschreibung?.toLowerCase().includes(query) ?? false)
    );
  });

  const filteredTickets =
    priorityFilter.size > 0
      ? searchFilteredTickets.filter((t) => priorityFilter.has(t.prioritaet))
      : searchFilteredTickets;

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const order: Record<string, number> = { dringend: 0, hoch: 1, normal: 2 };
    const diff = order[a.prioritaet] - order[b.prioritaet];
    if (diff !== 0) return diff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const dringendCount = tickets.filter((t) => t.prioritaet === "dringend").length;
  const hochCount = tickets.filter((t) => t.prioritaet === "hoch").length;
  const normalCount = tickets.filter((t) => t.prioritaet === "normal").length;

  return (
    <Card className="shrink-0">
      <CardHeader className="py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Offene Tickets</CardTitle>
              <span className="text-sm text-muted-foreground">
                ({(searchQuery || priorityFilter.size > 0) ? `${filteredTickets.length}/${tickets.length}` : tickets.length})
              </span>
            </div>

            {(dringendCount > 0 || hochCount > 0 || normalCount > 0) && (
              <div className="flex gap-2">
                <button
                  onClick={() => setPriorityFilter(new Set())}
                  className={`text-xs px-2 py-0.5 rounded transition-all cursor-pointer ${
                    priorityFilter.size === 0
                      ? "bg-foreground/10 text-foreground ring-1 ring-inset ring-foreground/25 font-medium"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  alle
                </button>
                {dringendCount > 0 && (
                  <button
                    onClick={() => togglePriority("dringend")}
                    className={`text-xs px-2 py-0.5 rounded transition-all cursor-pointer ${
                      priorityFilter.has("dringend")
                        ? "bg-destructive/30 text-destructive ring-1 ring-inset ring-destructive/50 font-medium"
                        : "bg-destructive/15 text-destructive hover:bg-destructive/25"
                    }`}
                  >
                    {dringendCount} dringend
                  </button>
                )}
                {hochCount > 0 && (
                  <button
                    onClick={() => togglePriority("hoch")}
                    className={`text-xs px-2 py-0.5 rounded transition-all cursor-pointer ${
                      priorityFilter.has("hoch")
                        ? "bg-warning/30 text-warning ring-1 ring-inset ring-warning/50 font-medium"
                        : "bg-warning/15 text-warning hover:bg-warning/25"
                    }`}
                  >
                    {hochCount} hoch
                  </button>
                )}
                {normalCount > 0 && (
                  <button
                    onClick={() => togglePriority("normal")}
                    className={`text-xs px-2 py-0.5 rounded transition-all cursor-pointer ${
                      priorityFilter.has("normal")
                        ? "bg-muted text-foreground ring-1 ring-inset ring-border font-medium"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {normalCount} normal
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tickets durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-7 text-sm"
            />
          </div>

          <Button variant="outline" size="sm" className="gap-1.5 h-7" asChild>
            <Link href="/tickets/new">
              <Plus className="h-3.5 w-3.5" />
              Neues Ticket
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="py-2 px-4">
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-3">
            {sortedTickets.length > 0 ? (
              sortedTickets.map((ticket) => (
                <CompactTicketCard key={ticket.id} ticket={ticket} />
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
