"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

interface MaintenanceTaskCardProps {
  task: MaintenanceTask;
  technician?: Technician;
  onConfirm?: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
}

export function MaintenanceTaskCard({
  task,
  technician,
  onConfirm,
  onCancel,
}: MaintenanceTaskCardProps) {
  const isActionable =
    task.confirmationStatus !== "confirmed" &&
    task.confirmationStatus !== "cancelled";

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Traffic light indicator */}
          <div className="pt-1">
            <ConfirmationStatusIndicator
              status={task.confirmationStatus}
              size="lg"
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Contact info */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">{task.contactPerson}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{task.location}</span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <a
                href={`tel:${task.phoneNumber}`}
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>{task.phoneNumber}</span>
              </a>
              <a
                href={`mailto:${task.email}`}
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate max-w-[150px]">{task.email}</span>
              </a>
            </div>
          </div>

          {/* Right side: status and technician */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <SchedulingStatusBadge status={task.schedulingStatus} />

            {technician && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-7 w-7">
                      <AvatarFallback
                        style={{ backgroundColor: technician.color }}
                        className="text-white text-xs"
                      >
                        {technician.initials}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{technician.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Action buttons - shown on hover or when actionable */}
            {isActionable && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onConfirm && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-success hover:text-success hover:bg-success/10"
                    onClick={() => onConfirm(task.id)}
                  >
                    Bestätigen
                  </Button>
                )}
                {onCancel && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onCancel(task.id)}
                  >
                    Stornieren
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
