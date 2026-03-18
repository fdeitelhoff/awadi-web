import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getVertragById } from "@/lib/data/vertraege";
import { getAnlTypen } from "@/lib/data/anlagen";
import { getInternalComments } from "@/lib/data/kommentare";
import { VertragEditForm } from "@/components/dashboard/vertrag-edit-form";
import type { SelectedAnlage } from "@/components/dashboard/anlage-picker";
import type { SelectedKunde } from "@/components/dashboard/kunde-picker";
import { Skeleton } from "@/components/ui/skeleton";

async function VertragDetail({ id }: { id: number }) {
  const [vertrag, anlTypen, initialKommentare] = await Promise.all([
    getVertragById(id),
    getAnlTypen(),
    getInternalComments("wartungsvertraege", id),
  ]);

  if (!vertrag) notFound();

  const initialAnlage: SelectedAnlage = {
    id: vertrag.anlage_id,
    label: vertrag.anlagen_nr ?? `Anlage #${vertrag.anlage_id}`,
  };

  const initialKunde: SelectedKunde | undefined =
    vertrag.kunden_id != null
      ? {
          id: vertrag.kunden_id,
          name: vertrag.kunde_name ?? `Kunde #${vertrag.kunden_id}`,
          address: "",
        }
      : undefined;

  return (
    <VertragEditForm
      vertrag={vertrag}
      anlTypen={anlTypen}
      initialAnlage={initialAnlage}
      initialKunde={initialKunde}
      initialKommentare={initialKommentare}
    />
  );
}

function VertragDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  );
}

export default async function VertragDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vertragId = parseInt(id, 10);

  if (isNaN(vertragId)) notFound();

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 w-full">
        <Suspense fallback={<VertragDetailSkeleton />}>
          <VertragDetail id={vertragId} />
        </Suspense>
      </div>
    </div>
  );
}
