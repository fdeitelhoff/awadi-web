// app/(dashboard)/tickets/[id]/page.tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTicketById } from "@/lib/data/tickets";
import { getActiveTechniker } from "@/lib/data/anlagen";
import { getInternalComments } from "@/lib/data/kommentare";
import { TicketEditForm } from "@/components/dashboard/ticket-edit-form";
import { Skeleton } from "@/components/ui/skeleton";

async function TicketDetail({ id }: { id: number }) {
  const [ticket, techniker, initialComments] = await Promise.all([
    getTicketById(id),
    getActiveTechniker(),
    getInternalComments("tickets", id),
  ]);

  if (!ticket) notFound();

  return (
    <TicketEditForm
      ticket={ticket}
      techniker={techniker}
      initialComments={initialComments}
    />
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
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

async function TicketDetailResolver({
  idPromise,
}: {
  idPromise: Promise<number>;
}) {
  const id = await idPromise;
  return <TicketDetail id={id} />;
}

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const idPromise = params.then(({ id }) => {
    const n = parseInt(id, 10);
    if (isNaN(n)) notFound();
    return n;
  });

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 w-full">
        <Suspense fallback={<TicketDetailSkeleton />}>
          <TicketDetailResolver idPromise={idPromise} />
        </Suspense>
      </div>
    </div>
  );
}
