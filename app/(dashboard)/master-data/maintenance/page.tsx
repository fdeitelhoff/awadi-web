import { Suspense } from "react";
import { VertragPageContent } from "@/components/dashboard/vertrag-table-server";
import { MasterDataSkeleton } from "../loading";

export default function FacilityMaintenanceDataPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 gap-4">
      <Suspense fallback={<MasterDataSkeleton />}>
        <VertragPageContent />
      </Suspense>
    </div>
  );
}
