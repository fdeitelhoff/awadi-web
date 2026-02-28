import { Suspense } from "react";
import { getUserRollen } from "@/lib/data/profiles";
import { UserCreateForm } from "@/components/dashboard/user-create-form";

async function NewUserContent() {
  const rollen = await getUserRollen();
  return <UserCreateForm rollen={rollen} />;
}

export default function NewUserPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 w-full">
        <Suspense>
          <NewUserContent />
        </Suspense>
      </div>
    </div>
  );
}
