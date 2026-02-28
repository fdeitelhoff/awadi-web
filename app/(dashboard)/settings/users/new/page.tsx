import { getUserRollen } from "@/lib/data/profiles";
import { UserCreateForm } from "@/components/dashboard/user-create-form";

export default async function NewUserPage() {
  const rollen = await getUserRollen();

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 w-full">
        <UserCreateForm rollen={rollen} />
      </div>
    </div>
  );
}
