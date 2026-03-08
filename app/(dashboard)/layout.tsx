import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <DashboardNav />
      <main className="flex-1 flex flex-col min-h-0 relative">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
