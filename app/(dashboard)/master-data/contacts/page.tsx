import { Suspense } from "react";
import { KontaktPageContent } from "@/components/dashboard/kontakt-table-server";
import { MasterDataSkeleton } from "../loading";

export default function ContactsPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 gap-4">
      <Suspense fallback={<MasterDataSkeleton />}>
        <KontaktPageContent />
      </Suspense>
    </div>
  );
}
