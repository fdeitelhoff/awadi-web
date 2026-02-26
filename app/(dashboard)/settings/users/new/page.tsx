import { UserCreateForm } from "@/components/dashboard/user-create-form";

export default function NewUserPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 w-full">
        <UserCreateForm />
      </div>
    </div>
  );
}
