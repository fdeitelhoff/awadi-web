import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <DashboardNav />
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  );
}
