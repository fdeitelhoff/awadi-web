import { Skeleton } from "@/components/ui/skeleton";

export function MasterDataSkeleton() {
  return (
    <>
      {/* Page header */}
      <div className="shrink-0">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-1.5" />
      </div>

      {/* Table block — mirrors CustomerTable (toolbar + rows) */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* Toolbar */}
        <div className="flex items-center justify-between shrink-0 pb-4 gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-[150px]" />
            <Skeleton className="h-9 w-[180px]" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        {/* Table rows — 14 rows at ROW_HEIGHT h-[46px] */}
        <div className="rounded-md border overflow-hidden flex-1 min-h-0">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="h-[46px] border-b last:border-b-0 flex items-center px-4 gap-6"
            >
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// Default export for Next.js route-level loading
export default function Loading() {
  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 gap-4">
      <MasterDataSkeleton />
    </div>
  );
}
