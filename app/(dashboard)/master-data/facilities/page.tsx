import { Suspense } from "react";
import { AnlagePageContent } from "@/components/dashboard/anlage-table-server";
import { MasterDataSkeleton } from "../loading";

export default function FacilitiesPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 gap-4">
      <Suspense fallback={<MasterDataSkeleton />}>
        <AnlagePageContent />
      </Suspense>
    </div>
  );
}
