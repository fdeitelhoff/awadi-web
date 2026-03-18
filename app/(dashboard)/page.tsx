import { Suspense } from "react";
import { getTickets } from "@/lib/data/tickets";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

async function DashboardData() {
  const { data: openTickets } = await getTickets({ filterStatus: "offen", pageSize: 100 });
  return <DashboardClient openTickets={openTickets} />;
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardData />
    </Suspense>
  );
}
