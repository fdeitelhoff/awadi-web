"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MaintenanceStatus } from "@/lib/types/maintenance";
import {
  CalendarCheck,
  Clock,
  Mail,
  Phone,
} from "lucide-react";

// Maintenance status badge with explanation
interface MaintenanceStatusBadgeProps {
  status: MaintenanceStatus;
  size?: "sm" | "md";
}

const maintenanceStatusConfig: Record<
  MaintenanceStatus,
  { label: string; description: string; icon: React.ReactNode; className: string; dotColor: string }
> = {
  unplanned: {
    label: "Ungeplant",
    description: "Termin noch nicht aktiv geplant",
    icon: <Clock className="h-3 w-3" />,
    className: "bg-muted text-muted-foreground hover:bg-muted",
    dotColor: "bg-muted-foreground",
  },
  not_answered: {
    label: "Keine Antwort",
    description: "Per Mail kontaktiert, keine Rückmeldung",
    icon: <Mail className="h-3 w-3" />,
    className: "bg-info/15 text-info hover:bg-info/20",
    dotColor: "bg-info",
  },
  contacted: {
    label: "Kontaktiert",
    description: "Kunde wurde kontaktiert",
    icon: <Phone className="h-3 w-3" />,
    className: "bg-warning/15 text-warning hover:bg-warning/20",
    dotColor: "bg-warning",
  },
  planned: {
    label: "Geplant",
    description: "Termin ist bestätigt und geplant",
    icon: <CalendarCheck className="h-3 w-3" />,
    className: "bg-success/15 text-success hover:bg-success/20",
    dotColor: "bg-success",
  },
};

export function MaintenanceStatusBadge({ status, size = "md" }: MaintenanceStatusBadgeProps) {
  const config = maintenanceStatusConfig[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={`gap-1 font-normal ${config.className} ${size === "sm" ? "text-[10px] px-1.5 py-0" : ""}`}
          >
            {config.icon}
            <span>{config.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Status indicator dot (for compact display)
interface MaintenanceStatusIndicatorProps {
  status: MaintenanceStatus;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export function MaintenanceStatusIndicator({
  status,
  size = "md",
}: MaintenanceStatusIndicatorProps) {
  const config = maintenanceStatusConfig[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`${sizeClasses[size]} ${config.dotColor} rounded-full shrink-0`}
            aria-label={config.label}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Export config for use in filters
export { maintenanceStatusConfig };

interface PriorityBadgeProps {
  priority: "low" | "medium" | "high" | "urgent";
}

const priorityConfig: Record<
  "low" | "medium" | "high" | "urgent",
  { label: string; className: string }
> = {
  low: {
    label: "Niedrig",
    className: "bg-muted text-muted-foreground",
  },
  medium: {
    label: "Mittel",
    className: "bg-info/15 text-info",
  },
  high: {
    label: "Hoch",
    className: "bg-warning/15 text-warning",
  },
  urgent: {
    label: "Dringend",
    className: "bg-destructive/15 text-destructive",
  },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge variant="secondary" className={`font-normal ${config.className}`}>
      {config.label}
    </Badge>
  );
}
