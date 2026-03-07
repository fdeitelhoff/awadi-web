import { getAnlTypen } from "@/lib/data/anlagen";
import { VertragCreateForm } from "@/components/dashboard/vertrag-create-form";

export default async function NewVertragPage() {
  const anlTypen = await getAnlTypen();

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 w-full">
        <VertragCreateForm anlTypen={anlTypen} />
      </div>
    </div>
  );
}
