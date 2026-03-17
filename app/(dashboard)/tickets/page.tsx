import { Suspense } from "react";
import { TicketPageContent } from "@/components/dashboard/ticket-table-server";
import { Skeleton } from "@/components/ui/skeleton";

export default function TicketsPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 gap-4">
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-[600px] w-full rounded-md border" />
          </div>
        }
      >
        <TicketPageContent />
      </Suspense>
    </div>
  );
}
