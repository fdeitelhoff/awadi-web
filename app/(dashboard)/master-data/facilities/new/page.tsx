import { Suspense } from "react";
import { getAnlTypen, getActiveTechniker } from "@/lib/data/anlagen";
import { AnlageCreateForm } from "@/components/dashboard/anlage-create-form";
import { Skeleton } from "@/components/ui/skeleton";

async function AnlageCreateData() {
  const [anlTypen, techniker] = await Promise.all([
    getAnlTypen(),
    getActiveTechniker(),
  ]);
  return <AnlageCreateForm anlTypen={anlTypen} techniker={techniker} />;
}

function AnlageCreateSkeleton() {
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
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

export default function NewFacilityPage() {
  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 w-full">
        <Suspense fallback={<AnlageCreateSkeleton />}>
          <AnlageCreateData />
        </Suspense>
      </div>
    </div>
  );
}
