import { getTickets } from "@/lib/data/tickets";
import { TicketTable } from "./ticket-table";

export async function TicketPageContent() {
  const result = await getTickets();

  return (
    <>
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">
          Tickets ({result.totalCount.toLocaleString("de-DE")})
        </h1>
        <p className="text-muted-foreground">
          Verwalten Sie eingehende Serviceanfragen und Störungsmeldungen.
        </p>
      </div>

      <TicketTable
        initialData={result.data}
        initialCount={result.totalCount}
      />
    </>
  );
}
