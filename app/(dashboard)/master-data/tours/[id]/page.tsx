// app/(dashboard)/master-data/tours/[id]/page.tsx
import { notFound } from "next/navigation";
import { getTourById, getTourEintraege } from "@/lib/data/touren";
import { TourGrid } from "@/components/dashboard/tour-grid";
import { TourEmailPanel } from "@/components/dashboard/tour-email-panel";
import { createClient } from "@/lib/supabase/server";
import type { Ticket } from "@/lib/types/ticket";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TourPlanningPage({ params }: Props) {
  const { id } = await params;
  const tourId = parseInt(id);
  if (isNaN(tourId)) notFound();

  const supabase = await createClient();
  const [tour, eintraege, ticketsRes] = await Promise.all([
    getTourById(tourId),
    getTourEintraege(tourId),
    supabase.from("tickets").select("*").eq("status", "offen"),
  ]);

  if (!tour) notFound();

  const scheduledTicketIds = new Set(eintraege.filter((e) => e.ticket_id != null).map((e) => e.ticket_id!));
  const openTickets = ((ticketsRes.data ?? []) as Ticket[]).filter(
    (t) => !scheduledTicketIds.has(t.id)
  );

  return (
    <div className="flex flex-col h-full">
      {tour.status === "veröffentlicht" && (
        <TourEmailPanel tourId={tourId} eintraege={eintraege} />
      )}
      <div className="flex-1 min-h-0">
        <TourGrid tour={tour} initialEintraege={eintraege} openTickets={openTickets} />
      </div>
    </div>
  );
}
