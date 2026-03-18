"use client";

import { useState } from "react";
import { MaintenanceCalendar } from "@/components/dashboard/maintenance-calendar";
import { RouteMapPanel } from "@/components/dashboard/route-map-panel";
import { TicketsPanel } from "@/components/dashboard/tickets-panel";
import { maintenanceTasks } from "@/lib/data/mock-data";
import type { MaintenanceTask } from "@/lib/types/maintenance";
import type { TicketListItem } from "@/lib/types/ticket";

interface DashboardClientProps {
  openTickets: TicketListItem[];
}

export function DashboardClient({ openTickets }: DashboardClientProps) {
  const [tasks, setTasks] = useState<MaintenanceTask[]>(maintenanceTasks);

  const handleConfirmTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, schedulingStatus: "confirmed", confirmationStatus: "confirmed" }
          : task
      )
    );
  };

  const handleCancelTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, schedulingStatus: "cancelled", confirmationStatus: "cancelled" }
          : task
      )
    );
  };

  return (
    <div className="flex-1 flex gap-4 p-4 min-h-0 overflow-hidden">
      <div className="w-[70%] flex flex-col gap-4 min-h-0">
        <MaintenanceCalendar
          tasks={tasks}
          onConfirmTask={handleConfirmTask}
          onCancelTask={handleCancelTask}
        />
        <TicketsPanel tickets={openTickets} />
      </div>
      <RouteMapPanel />
    </div>
  );
}
