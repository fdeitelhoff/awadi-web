"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MaintenanceTask, Technician } from "@/lib/types/maintenance";
import { Mail, MapPin, Phone } from "lucide-react";
import {
  ConfirmationStatusIndicator,
  SchedulingStatusBadge,
} from "./status-badge";

interface CompactTaskCardProps {
  task: MaintenanceTask;
  technician?: Technician;
  onConfirm?: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
}

// Extract city and zip from location string like "Straße 1, 12345 Stadt"
function parseLocation(location: string): { street: string; zipCity: string } {
  const parts = location.split(",");
  if (parts.length >= 2) {
    return {
      street: parts[0].trim(),
      zipCity: parts.slice(1).join(",").trim(),
    };
  }
  return { street: location, zipCity: "" };
}

export function CompactTaskCard({ task }: CompactTaskCardProps) {
  const { street, zipCity } = parseLocation(task.location);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-card border rounded-md p-2 hover:shadow-md transition-shadow cursor-pointer">
            {/* Header row: Traffic light + Name */}
            <div className="flex items-center gap-2 mb-1.5">
              <ConfirmationStatusIndicator
                status={task.confirmationStatus}
                size="md"
              />
              <span className="text-xs font-semibold flex-1 truncate">
                {task.contactPerson}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-start gap-1.5 mb-1">
              <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-[11px] text-muted-foreground leading-tight">
                <div className="truncate">{street}</div>
                <div className="font-medium text-foreground">{zipCity}</div>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
              <a
                href={`tel:${task.phoneNumber}`}
                className="text-[11px] hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {task.phoneNumber}
              </a>
            </div>

            {/* Status badge */}
            <SchedulingStatusBadge status={task.schedulingStatus} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium">{task.contactPerson}</div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span>{task.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span>{task.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span>{task.email}</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Technician tour card - shows all tasks for one technician on a day
interface TechnicianTourProps {
  technician: Technician;
  tasks: MaintenanceTask[];
  onConfirm?: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
}

export function TechnicianTour({
  technician,
  tasks,
}: TechnicianTourProps) {
  return (
    <div
      className="rounded-lg border-l-4 bg-card/50 p-1.5"
      style={{ borderLeftColor: technician.color }}
    >
      {/* Technician header */}
      <div className="flex items-center gap-1.5 mb-1.5 px-1">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
          style={{ backgroundColor: technician.color }}
        >
          {technician.initials}
        </div>
        <span className="text-[10px] font-medium truncate">
          {technician.name}
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {tasks.length} {tasks.length === 1 ? "Termin" : "Termine"}
        </span>
      </div>

      {/* Tasks for this technician */}
      <div className="space-y-1">
        {tasks.map((task) => (
          <TourTaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

// Compact task item within a technician tour
interface TourTaskItemProps {
  task: MaintenanceTask;
}

function TourTaskItem({ task }: TourTaskItemProps) {
  const { zipCity } = parseLocation(task.location);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-start gap-1.5 p-1.5 rounded bg-background hover:bg-muted/50 transition-colors cursor-pointer">
            <ConfirmationStatusIndicator
              status={task.confirmationStatus}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium truncate">
                {task.contactPerson}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {zipCity}
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground shrink-0">
              {task.phoneNumber.slice(-6)}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ConfirmationStatusIndicator
                status={task.confirmationStatus}
                size="md"
              />
              <span className="font-medium">{task.contactPerson}</span>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span>{task.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span>{task.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span>{task.email}</span>
              </div>
            </div>
            <div className="pt-1 border-t">
              <SchedulingStatusBadge status={task.schedulingStatus} />
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Unassigned tasks section
interface UnassignedTasksProps {
  tasks: MaintenanceTask[];
}

export function UnassignedTasks({ tasks }: UnassignedTasksProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="rounded-lg border-l-4 border-l-muted-foreground/30 bg-muted/30 p-1.5">
      <div className="flex items-center gap-1.5 mb-1.5 px-1">
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold bg-muted-foreground/30 text-muted-foreground shrink-0">
          ?
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">
          Nicht zugewiesen
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-1">
        {tasks.map((task) => (
          <TourTaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

// Future planned tasks section (interval-based, always visible)
interface FutureTasksProps {
  tasks: MaintenanceTask[];
}

export function FutureTasks({ tasks }: FutureTasksProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="rounded-lg border-l-4 border-l-gray-400 bg-gray-100/50 dark:bg-gray-800/30 p-1.5">
      <div className="flex items-center gap-1.5 mb-1.5 px-1">
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold bg-gray-400 text-white shrink-0">
          ⏱
        </div>
        <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
          Geplant (Intervall)
        </span>
        <span className="text-[10px] text-gray-500 ml-auto">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-1">
        {tasks.map((task) => (
          <TourTaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
