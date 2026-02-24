import { notFound } from "next/navigation";
import { getCustomerById } from "@/lib/data/customers";
import { CustomerEditForm } from "@/components/dashboard/customer-edit-form";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customerId = parseInt(id, 10);

  if (isNaN(customerId)) notFound();

  const kunde = await getCustomerById(customerId);
  if (!kunde) notFound();

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 w-full">
        <CustomerEditForm kunde={kunde} />
      </div>
    </div>
  );
}
