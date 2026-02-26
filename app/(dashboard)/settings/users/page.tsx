import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserTableServer } from "@/components/dashboard/user-table-server";

function UserTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-9 w-[180px]" />
      </div>
      <Skeleton className="h-[700px] rounded-md" />
    </div>
  );
}

export default function UsersPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 flex flex-col flex-1 min-h-0">
        <div className="mb-6 shrink-0">
          <h1 className="text-2xl font-semibold">Benutzer</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Benutzer und deren Berechtigungen
          </p>
        </div>

        <Suspense fallback={<UserTableSkeleton />}>
          <UserTableServer />
        </Suspense>
      </div>
    </div>
  );
}
