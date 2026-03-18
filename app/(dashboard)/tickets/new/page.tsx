import { Suspense } from "react";
import { getActiveTechniker } from "@/lib/data/anlagen";
import { TicketCreateForm } from "@/components/dashboard/ticket-create-form";
import { Skeleton } from "@/components/ui/skeleton";

async function TicketCreateData() {
  const techniker = await getActiveTechniker();
  return <TicketCreateForm techniker={techniker} />;
}

function TicketCreateSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl col-span-2" />
      </div>
    </div>
  );
}

export default function NewTicketPage() {
  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 w-full">
        <Suspense fallback={<TicketCreateSkeleton />}>
          <TicketCreateData />
        </Suspense>
      </div>
    </div>
  );
}
