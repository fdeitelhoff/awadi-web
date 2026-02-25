import { Suspense } from "react";
import { AnlTypPageContent } from "@/components/dashboard/anl-typ-table-server";
import { Skeleton } from "@/components/ui/skeleton";

function FacilityTypesSkeleton() {
  return (
    <>
      <div className="shrink-0 space-y-1">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-2 pb-4 shrink-0">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-28 ml-auto" />
        </div>
        <Skeleton className="rounded-md flex-1 min-h-0" />
      </div>
    </>
  );
}

export default function FacilityTypesPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 gap-4">
      <Suspense fallback={<FacilityTypesSkeleton />}>
        <AnlTypPageContent />
      </Suspense>
    </div>
  );
}
