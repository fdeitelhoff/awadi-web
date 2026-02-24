import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomerById } from "@/lib/data/customers";
import { CustomerEditForm } from "@/components/dashboard/customer-edit-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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

  const displayName =
    kunde.firma ||
    [kunde.vorname, kunde.nachname].filter(Boolean).join(" ") ||
    "Kunde";

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 max-w-4xl w-full mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/master-data/customers">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-semibold">{displayName}</h1>
          {kunde.kundennr && (
            <p className="text-muted-foreground text-sm">{kunde.kundennr}</p>
          )}
        </div>

        <CustomerEditForm kunde={kunde} />
      </div>
    </div>
  );
}
