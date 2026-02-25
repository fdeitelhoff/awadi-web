import { getAnlTypen } from "@/lib/data/anlagen";
import { AnlageCreateForm } from "@/components/dashboard/anlage-create-form";

export default async function NewFacilityPage() {
  const anlTypen = await getAnlTypen();

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 w-full">
        <AnlageCreateForm anlTypen={anlTypen} />
      </div>
    </div>
  );
}
