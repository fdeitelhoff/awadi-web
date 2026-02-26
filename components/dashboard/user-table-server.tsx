import { getProfiles } from "@/lib/data/profiles";
import { UserTable } from "@/components/dashboard/user-table";

export async function UserTableServer() {
  const result = await getProfiles({ sortField: "nachname", sortDirection: "asc" });

  return (
    <UserTable
      initialData={result.data}
      initialCount={result.totalCount}
    />
  );
}
