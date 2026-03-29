import { Suspense } from "react";
import { connection } from "next/server";
import { getTickets } from "@/lib/data/tickets";
import { getPublishedTourEintraegeForDateRange } from "@/lib/data/touren";
import { getWartungskalenderEintraege, getAktiveTechniker } from "@/lib/data/wartungsvertraege";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

async function DashboardData() {
  await connection();
  const today = new Date();
  const von = today.toISOString().slice(0, 10);
  const bis6w = new Date(today.getTime() + 42 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [{ data: openTickets }, publishedEintraege, wartungseintraege, techniker] =
    await Promise.all([
      getTickets({ filterStatus: "offen", pageSize: 100 }),
      getPublishedTourEintraegeForDateRange(von, bis6w),
      getWartungskalenderEintraege(von, bis6w),
      getAktiveTechniker(),
    ]);

  return (
    <DashboardClient
      openTickets={openTickets}
      techniker={techniker}
      wartungseintraege={wartungseintraege}
      publishedEintraege={publishedEintraege}
      initialVon={von}
      initialBis={bis6w}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardData />
    </Suspense>
  );
}
