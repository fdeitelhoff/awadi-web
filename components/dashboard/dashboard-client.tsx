"use client";

import { useCallback, useState } from "react";
import { MaintenanceCalendar } from "@/components/dashboard/maintenance-calendar";
import { RouteMapPanel } from "@/components/dashboard/route-map-panel";
import { TicketsPanel } from "@/components/dashboard/tickets-panel";
import type { KalenderTechniker, WartungsKalenderEintrag } from "@/lib/types/wartung";
import type { TicketListItem } from "@/lib/types/ticket";
import type { TourEintrag } from "@/lib/types/tour";

interface DashboardClientProps {
  openTickets: TicketListItem[];
  techniker: KalenderTechniker[];
  wartungseintraege: WartungsKalenderEintrag[];
  publishedEintraege: TourEintrag[];
  initialVon: string;
  initialBis: string;
}

export function DashboardClient({
  openTickets,
  techniker,
  wartungseintraege: initialWartungseintraege,
  publishedEintraege: initialPublishedEintraege,
  initialVon,
  initialBis,
}: DashboardClientProps) {
  const [wartungseintraege, setWartungseintraege] = useState(initialWartungseintraege);
  const [publishedEintraege, setPublishedEintraege] = useState(initialPublishedEintraege);
  const [loadedWindow, setLoadedWindow] = useState({ von: initialVon, bis: initialBis });

  const handleWindowChange = useCallback(async (von: string, bis: string) => {
    try {
      const res = await fetch(`/api/kalender?von=${von}&bis=${bis}`);
      if (!res.ok) return;
      const data = await res.json() as {
        wartungseintraege: WartungsKalenderEintrag[];
        publishedEintraege: TourEintrag[];
      };
      setWartungseintraege(data.wartungseintraege ?? []);
      setPublishedEintraege(data.publishedEintraege ?? []);
      setLoadedWindow({ von, bis });
    } catch {
      // silently keep existing data
    }
  }, []);

  return (
    <div className="flex-1 flex gap-4 p-4 min-h-0 overflow-hidden">
      <div className="w-[70%] flex flex-col gap-4 min-h-0">
        <MaintenanceCalendar
          techniker={techniker}
          wartungseintraege={wartungseintraege}
          publishedEintraege={publishedEintraege}
          loadedWindow={loadedWindow}
          onWindowChange={handleWindowChange}
        />
        <TicketsPanel tickets={openTickets} />
      </div>
      <RouteMapPanel />
    </div>
  );
}
