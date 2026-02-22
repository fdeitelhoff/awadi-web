import { Suspense } from "react";
import { CustomerPageContent } from "@/components/dashboard/customer-table-server";
import { MasterDataSkeleton } from "../loading";

export default function CustomersPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 gap-4">
      <Suspense fallback={<MasterDataSkeleton />}>
        <CustomerPageContent />
      </Suspense>
    </div>
  );
}
