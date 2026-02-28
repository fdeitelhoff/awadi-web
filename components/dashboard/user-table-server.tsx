import { getProfiles, getUserRollen } from "@/lib/data/profiles";
import { UserTable } from "@/components/dashboard/user-table";

export async function UserTableServer() {
  const [result, rollen] = await Promise.all([
    getProfiles({ sortField: "nachname", sortDirection: "asc" }),
    getUserRollen(),
  ]);

  return (
    <UserTable
      initialData={result.data}
      initialCount={result.totalCount}
      rollen={rollen}
    />
  );
}
