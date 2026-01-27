"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export function CompactTaskCard({
  task,
  technician,
}: CompactTaskCardProps) {
  const { street, zipCity } = parseLocation(task.location);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-card border rounded-md p-2 hover:shadow-md transition-shadow cursor-pointer">
            {/* Header row: Traffic light + Name + Technician */}
            <div className="flex items-center gap-2 mb-1.5">
              <ConfirmationStatusIndicator
                status={task.confirmationStatus}
                size="md"
              />
              <span className="text-xs font-semibold flex-1 truncate">
                {task.contactPerson}
              </span>
              {technician && (
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarFallback
                    style={{ backgroundColor: technician.color }}
                    className="text-white text-[9px] font-medium"
                  >
                    {technician.initials}
                  </AvatarFallback>
                </Avatar>
              )}
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
            <div className="flex justify-end">
              <SchedulingStatusBadge status={task.schedulingStatus} />
            </div>
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
            {technician && (
              <div className="text-xs pt-1 border-t">
                Techniker: {technician.name}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
