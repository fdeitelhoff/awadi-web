// components/dashboard/tour-grid.tsx — placeholder, Task 15 will replace this
"use client";
import type { Tour, TourEintrag } from "@/lib/types/tour";
import type { Ticket } from "@/lib/types/ticket";

interface Props {
  tour: Tour;
  initialEintraege: TourEintrag[];
  openTickets: Ticket[];
}

export function TourGrid(_props: Props) {
  return <div>Tour-Grid wird geladen…</div>;
}
