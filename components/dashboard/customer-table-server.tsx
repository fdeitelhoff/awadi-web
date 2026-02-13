import { getCustomers, getCustomerCount } from "@/lib/data/customers";
import { CustomerTable } from "./customer-table";
import { MasterDataSections } from "./master-data-sections";

export async function MasterDataContent() {
  const [customerResult, customerCount] = await Promise.all([
    getCustomers(),
    getCustomerCount(),
  ]);

  return (
    <MasterDataSections
      customerCount={customerCount}
      kundenContent={
        <CustomerTable
          initialData={customerResult.data}
          initialCount={customerResult.totalCount}
          initialFilterOrte={customerResult.filterOptions.orte}
        />
      }
    />
  );
}
