import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCustomerById } from "@/lib/data/customers";
import { getInternalComments } from "@/lib/data/kommentare";
import { CustomerEditForm } from "@/components/dashboard/customer-edit-form";
import { Skeleton } from "@/components/ui/skeleton";

async function CustomerDetail({ id }: { id: number }) {
  const [kunde, kommentare] = await Promise.all([
    getCustomerById(id),
    getInternalComments("kunden", id),
  ]);
  if (!kunde) notFound();
  return <CustomerEditForm kunde={kunde} initialKommentare={kommentare} />;
}

function CustomerDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header: back button + title/meta + save button */}
      <div>
        <Skeleton className="h-8 w-16 mb-2" />
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      {/* Cards grid — heights derived from actual card content:
           CardHeader (~56px) + rows×62px + gaps×16px + 24px bottom padding
           Stammdaten: 4 rows → ~376px  Adresse: 3 rows → ~298px
           Kontakt:    4 rows → ~376px  Anmerkungen: empty state → ~208px  */}
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-[300px] rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-56 rounded-lg" />
      </div>
    </div>
  );
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customerId = parseInt(id, 10);

  if (isNaN(customerId)) notFound();

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 w-full">
        <Suspense fallback={<CustomerDetailSkeleton />}>
          <CustomerDetail id={customerId} />
        </Suspense>
      </div>
    </div>
  );
}
