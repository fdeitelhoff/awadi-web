import { Suspense } from "react";
import { connection } from "next/server";
import { getTickets } from "@/lib/data/tickets";
import { getPublishedTourEintraegeForDateRange } from "@/lib/data/touren";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

async function DashboardData() {
  await connection();
  const today = new Date();
  const von = today.toISOString().slice(0, 10);
  const bis4w = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [{ data: openTickets }, publishedEintraege] = await Promise.all([
    getTickets({ filterStatus: "offen", pageSize: 100 }),
    getPublishedTourEintraegeForDateRange(von, bis4w),
  ]);
  return <DashboardClient openTickets={openTickets} publishedEintraege={publishedEintraege} />;
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardData />
    </Suspense>
  );
}
