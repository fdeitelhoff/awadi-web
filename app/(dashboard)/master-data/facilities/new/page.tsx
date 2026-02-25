import { AnlageCreateForm } from "@/components/dashboard/anlage-create-form";

export default function NewFacilityPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 w-full">
        <AnlageCreateForm />
      </div>
    </div>
  );
}
