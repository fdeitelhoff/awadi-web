import { AnlTypCreateForm } from "@/components/dashboard/anl-typ-create-form";

export default function NewFacilityTypePage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 w-full">
        <AnlTypCreateForm />
      </div>
    </div>
  );
}
