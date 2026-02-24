import { CustomerCreateForm } from "@/components/dashboard/customer-create-form";

export default function NewCustomerPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 w-full">
        <CustomerCreateForm />
      </div>
    </div>
  );
}
