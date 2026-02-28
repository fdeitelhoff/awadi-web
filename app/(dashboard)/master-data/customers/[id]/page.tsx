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
