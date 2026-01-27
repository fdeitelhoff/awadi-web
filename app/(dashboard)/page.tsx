"use client";

import { MaintenanceCalendar } from "@/components/dashboard/maintenance-calendar";
import { TicketsSidebar } from "@/components/dashboard/tickets-sidebar";
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
    <div className="flex-1 flex gap-4 p-4 min-h-0">
      {/* Main calendar area */}
      <MaintenanceCalendar
        tasks={tasks}
        onConfirmTask={handleConfirmTask}
        onCancelTask={handleCancelTask}
      />

      {/* Tickets sidebar */}
      <TicketsSidebar
        tickets={serviceTickets}
        onScheduleTicket={handleScheduleTicket}
      />
    </div>
  );
}
