import { Suspense } from "react";
import { MasterDataContent } from "@/components/dashboard/customer-table-server";
import { MasterDataSkeleton } from "../loading";

export default function CustomersPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kunden</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Kunden und deren Stammdaten
        </p>
      </div>

      <Suspense fallback={<MasterDataSkeleton />}>
        <MasterDataContent />
      </Suspense>
    </div>
  );
}
