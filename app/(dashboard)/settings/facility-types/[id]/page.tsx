import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAnlTypById } from "@/lib/data/anl-typen";
import { getInternalComments } from "@/lib/data/kommentare";
import { AnlTypEditForm } from "@/components/dashboard/anl-typ-edit-form";
import { Skeleton } from "@/components/ui/skeleton";

async function AnlTypDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const typId = parseInt(id, 10);
  if (isNaN(typId)) notFound();
  const [typ, initialKommentare] = await Promise.all([
    getAnlTypById(typId),
    getInternalComments("anl_typen", typId),
  ]);
  if (!typ) notFound();
  return <AnlTypEditForm typ={typ} initialKommentare={initialKommentare} />;
}

function AnlTypDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function FacilityTypeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 w-full">
        <Suspense fallback={<AnlTypDetailSkeleton />}>
          <AnlTypDetail params={params} />
        </Suspense>
      </div>
    </div>
  );
}
