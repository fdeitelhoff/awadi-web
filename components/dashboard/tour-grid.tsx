// components/dashboard/tour-grid.tsx
"use client";

import { Fragment, useState, useTransition } from "react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { Tour, TourEintrag } from "@/lib/types/tour";
import { TourStopCard } from "@/components/dashboard/tour-stop-card";
import { TourTicketSidebar } from "@/components/dashboard/tour-ticket-sidebar";
import { moveTourEintrag, publishTour, revertToDraft, reoptimiseDay } from "@/lib/actions/touren";

interface Props {
  tour: Tour;
  initialEintraege: TourEintrag[];
  /** Open tickets not yet assigned to this tour — fetched server-side and passed in */
  openTickets: import("@/lib/types/ticket").Ticket[];
}

function getDatesInRange(von: string, bis: string): string[] {
  const dates: string[] = [];
  const cur = new Date(von + "T12:00:00Z");
  const end = new Date(bis + "T12:00:00Z");
  while (cur <= end) {
    const dow = cur.getUTCDay();
    if (dow >= 1 && dow <= 5) dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

function formatDateDE(date: string): string {
  return new Date(date + "T12:00:00Z").toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export function TourGrid({ tour, initialEintraege, openTickets: initialOpenTickets }: Props) {
  const [eintraege, setEintraege] = useState<TourEintrag[]>(initialEintraege);
  const [tourStatus, setTourStatus] = useState(tour.status);
  const [openTickets, setOpenTickets] = useState(initialOpenTickets);
  const [isPending, startTransition] = useTransition();

  const [technikerIds] = useState(() => [...new Set(initialEintraege.map(e => e.techniker_id))]);

  const dates = getDatesInRange(tour.von, tour.bis);

  function getStopsForCell(techId: string, datum: string): TourEintrag[] {
    return eintraege
      .filter(e => e.techniker_id === techId && e.datum === datum)
      .sort((a, b) => a.position - b.position);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    // Cell drop target id format: "cell||{techId}||{datum}"
    // IMPORTANT: use "||" not "-" as separator — techId is a UUID which contains hyphens.
    const overStr = String(over.id);
    if (!overStr.startsWith("cell||")) return;
    const parts = overStr.split("||");
    const techId = parts[1]!;
    const datum = parts[2]!;
    const stopId = parseInt(String(active.id));
    const targetStops = getStopsForCell(techId, datum);

    startTransition(async () => {
      const result = await moveTourEintrag(stopId, techId, datum, targetStops.length);
      if (result.success && result.eintraege) {
        setEintraege(result.eintraege);
      } else {
        toast.error(result.error ?? "Fehler beim Verschieben");
      }
    });
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await publishTour(tour.id);
      if (result.success) { setTourStatus("veröffentlicht"); toast.success("Tour veröffentlicht"); }
      else toast.error(result.error ?? "Fehler");
    });
  }

  function handleRevert() {
    startTransition(async () => {
      const result = await revertToDraft(tour.id);
      if (result.success) { setTourStatus("entwurf"); toast.success("Tour zurück zu Entwurf"); }
      else toast.error(result.error ?? "Fehler");
    });
  }

  async function handleReoptimise(techId: string, datum: string) {
    const result = await reoptimiseDay(tour.id, techId, datum);
    if (result.success && result.eintraege) { setEintraege(result.eintraege); toast.success("Route neu berechnet"); }
    else toast.error(result.error ?? "Fehler");
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b flex-wrap">
          <h1 className="text-xl font-semibold flex-1">{tour.name}</h1>
          <Badge variant={tourStatus === "veröffentlicht" ? "default" : "secondary"}>
            {tourStatus === "veröffentlicht" ? "Veröffentlicht" : "Entwurf"}
          </Badge>
          {tour.partial && <Badge variant="destructive">Unvollständig</Badge>}
          {tourStatus === "entwurf" ? (
            <Button onClick={handlePublish} disabled={isPending}>Veröffentlichen</Button>
          ) : (
            <Button variant="outline" onClick={handleRevert} disabled={isPending}>Zurück zu Entwurf</Button>
          )}
        </div>

        {/* Main area: grid + sidebar */}
        <div className="flex flex-1 overflow-hidden gap-4 p-4">
          <ScrollArea className="flex-1">
            <div className="inline-grid" style={{ gridTemplateColumns: `160px repeat(${dates.length}, minmax(160px, 1fr))` }}>
              {/* Header row */}
              <div className="p-2 font-medium text-sm text-muted-foreground border-b">Techniker</div>
              {dates.map(d => (
                <div key={d} className="p-2 font-medium text-sm border-b text-center">{formatDateDE(d)}</div>
              ))}
              {/* Technician rows */}
              {technikerIds.map(techId => (
                <Fragment key={techId}>
                  <div className="p-2 text-sm font-medium border-b self-start pt-3 truncate">
                    {eintraege.find(e => e.techniker_id === techId)?.techniker_name ?? techId.slice(0, 8)}
                  </div>
                  {dates.map(datum => {
                    const stops = getStopsForCell(techId, datum);
                    const totalMins = stops.reduce((s, e) => s + (e.dauer_minuten ?? 0) + (e.fahrtzeit_minuten ?? 0), 0);
                    return (
                      <div
                        key={`cell||${techId}||${datum}`}
                        id={`cell||${techId}||${datum}`}
                        className="border border-dashed rounded-md m-1 p-1 min-h-[80px] space-y-1"
                      >
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] text-muted-foreground">{totalMins} min</span>
                          <Button
                            variant="ghost" size="icon" className="h-5 w-5"
                            onClick={() => handleReoptimise(techId, datum)}
                            title="Route neu berechnen"
                            disabled={isPending || stops.length === 0}
                          >
                            ↺
                          </Button>
                        </div>
                        {stops.map(stop => (
                          <TourStopCard key={stop.id} stop={stop} />
                        ))}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TourTicketSidebar tickets={openTickets} />
        </div>
      </div>
    </DndContext>
  );
}
