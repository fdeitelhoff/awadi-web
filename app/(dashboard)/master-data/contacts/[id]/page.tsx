import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getKontaktById } from "@/lib/data/kontakte";
import { KontaktEditForm } from "@/components/dashboard/kontakt-edit-form";
import { Skeleton } from "@/components/ui/skeleton";

async function KontaktDetail({ id }: { id: number }) {
  const kontakt = await getKontaktById(id);
  if (!kontakt) notFound();
  return <KontaktEditForm kontakt={kontakt} />;
}

function KontaktDetailSkeleton() {
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
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
    </div>
  );
}

export default async function KontaktDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kontaktId = parseInt(id, 10);

  if (isNaN(kontaktId)) notFound();

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 w-full">
        <Suspense fallback={<KontaktDetailSkeleton />}>
          <KontaktDetail id={kontaktId} />
        </Suspense>
      </div>
    </div>
  );
}
