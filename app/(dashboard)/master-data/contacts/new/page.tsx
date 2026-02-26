import { KontaktCreateForm } from "@/components/dashboard/kontakt-create-form";

export default function NewKontaktPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 w-full">
        <KontaktCreateForm />
      </div>
    </div>
  );
}
