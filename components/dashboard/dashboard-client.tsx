"use client";

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
  publishedEintraege?: TourEintrag[];
}

export function DashboardClient({
  openTickets,
  techniker,
  wartungseintraege,
  publishedEintraege = [],
}: DashboardClientProps) {
  return (
    <div className="flex-1 flex gap-4 p-4 min-h-0 overflow-hidden">
      <div className="w-[70%] flex flex-col gap-4 min-h-0">
        <MaintenanceCalendar
          techniker={techniker}
          wartungseintraege={wartungseintraege}
          publishedEintraege={publishedEintraege}
        />
        <TicketsPanel tickets={openTickets} />
      </div>
      <RouteMapPanel />
    </div>
  );
}
