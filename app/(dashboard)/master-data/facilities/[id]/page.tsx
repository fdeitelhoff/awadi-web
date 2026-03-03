import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAnlageById, getAnlTypen, getActiveTechniker } from "@/lib/data/anlagen";
import { getKontaktById } from "@/lib/data/kontakte";
import { getInternalComments } from "@/lib/data/kommentare";
import { AnlageEditForm } from "@/components/dashboard/anlage-edit-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnlTyp } from "@/lib/types/anlage";

async function AnlageDetail({ id }: { id: number }) {
  const [anlTypen, techniker, anlage] = await Promise.all([
    getAnlTypen(),
    getActiveTechniker(),
    getAnlageById(id),
  ]);
  if (!anlage) notFound();

  const [initialKontakt, initialKommentare] = await Promise.all([
    anlage.kontakt_id != null
      ? getKontaktById(anlage.kontakt_id).then((k) => k ?? undefined)
      : Promise.resolve(undefined),
    getInternalComments("anlagen", id),
  ]);

  return (
    <AnlageEditForm
      anlage={anlage}
      anlTypen={anlTypen}
      techniker={techniker}
      initialKontakt={initialKontakt}
      initialKommentare={initialKommentare}
    />
  );
}

function AnlageDetailSkeleton() {
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
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function FacilityDetailPage({
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
        <Suspense fallback={<AnlageDetailSkeleton />}>
          <AnlageDetailResolver idPromise={idPromise} />
        </Suspense>
      </div>
    </div>
  );
}

async function AnlageDetailResolver({ idPromise }: { idPromise: Promise<number> }) {
  const id = await idPromise;
  return <AnlageDetail id={id} />;
}
