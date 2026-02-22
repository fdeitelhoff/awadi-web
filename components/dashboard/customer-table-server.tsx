import { getCustomers, getCustomerCount } from "@/lib/data/customers";
import { CustomerTable } from "./customer-table";

export async function CustomerPageContent() {
  const [customerResult, customerCount] = await Promise.all([
    getCustomers(),
    getCustomerCount(),
  ]);

  return (
    <>
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">Kunden ({customerCount})</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Kunden und deren Stammdaten
        </p>
      </div>

      <CustomerTable
        initialData={customerResult.data}
        initialCount={customerResult.totalCount}
        initialFilterOrte={customerResult.filterOptions.orte}
      />
    </>
  );
}
