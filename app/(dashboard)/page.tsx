"use client";

import { MaintenanceCalendar } from "@/components/dashboard/maintenance-calendar";
import { RouteMapPanel } from "@/components/dashboard/route-map-panel";
import { TicketsPanel } from "@/components/dashboard/tickets-panel";
import { maintenanceTasks, serviceTickets } from "@/lib/data/mock-data";
import { MaintenanceTask } from "@/lib/types/maintenance";
import { useState } from "react";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>(maintenanceTasks);

  const handleConfirmTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              schedulingStatus: "confirmed",
              confirmationStatus: "confirmed",
            }
          : task
      )
    );
  };

  const handleCancelTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              schedulingStatus: "cancelled",
              confirmationStatus: "cancelled",
            }
          : task
      )
    );
  };

  const handleScheduleTicket = (ticketId: string) => {
    // TODO: Open scheduling modal/dialog
    console.log("Schedule ticket:", ticketId);
  };

  return (
    <div className="flex-1 flex gap-4 p-4 min-h-0 overflow-hidden">
      {/* Left side: Calendar (top) + Tickets (bottom) - 70% width */}
      <div className="w-[70%] flex flex-col gap-4 min-h-0">
        {/* Calendar area - scrollable */}
        <MaintenanceCalendar
          tasks={tasks}
          onConfirmTask={handleConfirmTask}
          onCancelTask={handleCancelTask}
        />

        {/* Tickets panel - sticky at bottom */}
        <TicketsPanel
          tickets={serviceTickets}
          onScheduleTicket={handleScheduleTicket}
        />
      </div>

      {/* Right side: Route map - 30% width */}
      <RouteMapPanel />
    </div>
  );
}
