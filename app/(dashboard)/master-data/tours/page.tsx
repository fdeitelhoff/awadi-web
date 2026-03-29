import { Suspense } from "react";
import { TourPageContent } from "@/components/dashboard/tour-table-server";
import { MasterDataSkeleton } from "../loading";

export default function ToursPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 gap-4">
      <Suspense fallback={<MasterDataSkeleton />}>
        <TourPageContent />
      </Suspense>
    </div>
  );
}
