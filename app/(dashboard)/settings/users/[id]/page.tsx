import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProfileById, getUserRollen } from "@/lib/data/profiles";
import { getInternalComments } from "@/lib/data/kommentare";
import { getAbwesenheiten } from "@/lib/data/abwesenheiten";
import { UserEditForm } from "@/components/dashboard/user-edit-form";
import { Skeleton } from "@/components/ui/skeleton";

async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, initialKommentare, initialAbwesenheiten, rollen] = await Promise.all([
    getProfileById(id),
    getInternalComments("profiles", id),
    getAbwesenheiten(id),
    getUserRollen(),
  ]);

  if (!profile) notFound();

  return (
    <UserEditForm
      profile={profile}
      initialKommentare={initialKommentare}
      initialAbwesenheiten={initialAbwesenheiten}
      rollen={rollen}
    />
  );
}

function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-72 rounded-xl col-span-2" />
      </div>
    </div>
  );
}

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 w-full">
        <Suspense fallback={<UserDetailSkeleton />}>
          <UserDetail params={params} />
        </Suspense>
      </div>
    </div>
  );
}
