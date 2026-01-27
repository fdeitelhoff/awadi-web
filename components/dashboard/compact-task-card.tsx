"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MaintenanceTask, Technician } from "@/lib/types/maintenance";
import { Mail, MapPin, Phone, User } from "lucide-react";
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

export function CompactTaskCard({
  task,
  technician,
}: CompactTaskCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-card border rounded p-1.5 hover:shadow-sm transition-shadow cursor-pointer">
            <div className="flex items-start gap-1.5">
              {/* Traffic light */}
              <ConfirmationStatusIndicator
                status={task.confirmationStatus}
                size="sm"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-medium truncate">
                    {task.contactPerson}
                  </span>
                  {technician && (
                    <Avatar className="h-4 w-4 shrink-0">
                      <AvatarFallback
                        style={{ backgroundColor: technician.color }}
                        className="text-white text-[8px]"
                      >
                        {technician.initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {task.location.split(",")[0]}
                </div>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            {/* Header with status */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ConfirmationStatusIndicator
                  status={task.confirmationStatus}
                  size="md"
                />
                <span className="font-medium">{task.contactPerson}</span>
              </div>
              <SchedulingStatusBadge status={task.schedulingStatus} />
            </div>

            {/* Contact details */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span>{task.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 shrink-0 text-muted-foreground" />
                <a
                  href={`tel:${task.phoneNumber}`}
                  className="hover:text-primary"
                >
                  {task.phoneNumber}
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
                <a
                  href={`mailto:${task.email}`}
                  className="hover:text-primary truncate"
                >
                  {task.email}
                </a>
              </div>
            </div>

            {/* Technician */}
            {technician && (
              <div className="flex items-center gap-1.5 text-xs pt-1 border-t">
                <User className="h-3 w-3 text-muted-foreground" />
                <span>Techniker: {technician.name}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
