"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmationStatus, SchedulingStatus } from "@/lib/types/maintenance";
import {
  Check,
  CheckCheck,
  Clock,
  Mail,
  MailCheck,
  Phone,
  X,
} from "lucide-react";

interface SchedulingStatusBadgeProps {
  status: SchedulingStatus;
}

const schedulingStatusConfig: Record<
  SchedulingStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  not_contacted: {
    label: "Nicht kontaktiert",
    icon: <Clock className="h-3 w-3" />,
    className: "bg-muted text-muted-foreground hover:bg-muted",
  },
  email_sent: {
    label: "E-Mail gesendet",
    icon: <Mail className="h-3 w-3" />,
    className: "bg-info/15 text-info hover:bg-info/20",
  },
  email_confirmed: {
    label: "E-Mail bestätigt",
    icon: <MailCheck className="h-3 w-3" />,
    className: "bg-info/25 text-info hover:bg-info/30",
  },
  phone_called: {
    label: "Telefonisch kontaktiert",
    icon: <Phone className="h-3 w-3" />,
    className: "bg-warning/15 text-warning hover:bg-warning/20",
  },
  confirmed: {
    label: "Vom Kunden bestätigt",
    icon: <CheckCheck className="h-3 w-3" />,
    className: "bg-success/15 text-success hover:bg-success/20",
  },
  cancelled: {
    label: "Storniert",
    icon: <X className="h-3 w-3" />,
    className: "bg-destructive/15 text-destructive hover:bg-destructive/20",
  },
};

export function SchedulingStatusBadge({ status }: SchedulingStatusBadgeProps) {
  const config = schedulingStatusConfig[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={`gap-1 font-normal ${config.className}`}
          >
            {config.icon}
            <span className="hidden sm:inline">{config.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ConfirmationStatusIndicatorProps {
  status: ConfirmationStatus;
  size?: "sm" | "md" | "lg";
}

const confirmationStatusConfig: Record<
  ConfirmationStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Ausstehend",
    className: "bg-muted-foreground",
  },
  tentative: {
    label: "Vorläufig",
    className: "bg-warning",
  },
  confirmed: {
    label: "Bestätigt",
    className: "bg-success",
  },
  cancelled: {
    label: "Storniert",
    className: "bg-destructive",
  },
};

const sizeClasses = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export function ConfirmationStatusIndicator({
  status,
  size = "md",
}: ConfirmationStatusIndicatorProps) {
  const config = confirmationStatusConfig[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`${sizeClasses[size]} ${config.className} rounded-full shrink-0`}
            aria-label={config.label}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

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
