"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaintenanceTask } from "@/lib/types/maintenance";
import { Calendar, MapPin, Route, Users } from "lucide-react";
import { useMemo, useState } from "react";

interface TourPlanningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: MaintenanceTask[];
  onStartPlanning?: (startWeek: number, endWeek: number) => void;
}

// Get week number from date
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Get start of week (Monday)
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get end of week (Sunday)
function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

// Get date from week number and year
function getDateFromWeek(weekNumber: number, year: number): Date {
  const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return ISOweekStart;
}

// Generate available weeks for selection (current week + 12 weeks ahead)
function getAvailableWeeks(): { weekNumber: number; year: number; label: string }[] {
  const weeks: { weekNumber: number; year: number; label: string }[] = [];
  const today = new Date();
  const currentWeek = getWeekNumber(today);
  const currentYear = today.getFullYear();

  for (let i = 0; i < 12; i++) {
    let week = currentWeek + i;
    let year = currentYear;

    // Handle year rollover (assume 52 weeks per year for simplicity)
    if (week > 52) {
      week = week - 52;
      year = currentYear + 1;
    }

    weeks.push({
      weekNumber: week,
      year,
      label: `KW ${week}${year !== currentYear ? ` (${year})` : ""}`,
    });
  }

  return weeks;
}

export function TourPlanningDialog({
  open,
  onOpenChange,
  tasks,
  onStartPlanning,
}: TourPlanningDialogProps) {
  const availableWeeks = useMemo(() => getAvailableWeeks(), []);

  // Default to current week
  const [startWeekIndex, setStartWeekIndex] = useState(0);
  // Default end week is start week + 1 (so 2 weeks selected)
  const [endWeekIndex, setEndWeekIndex] = useState(1);

  // Calculate statistics for selected range
  const stats = useMemo(() => {
    const startWeekData = availableWeeks[startWeekIndex];
    const endWeekData = availableWeeks[endWeekIndex];

    if (!startWeekData || !endWeekData) {
      return { total: 0, unplanned: 0, planned: 0, contacted: 0, notAnswered: 0 };
    }

    const rangeStart = getDateFromWeek(startWeekData.weekNumber, startWeekData.year);
    const rangeEnd = getEndOfWeek(getDateFromWeek(endWeekData.weekNumber, endWeekData.year));

    // Filter tasks within the selected range
    const tasksInRange = tasks.filter((task) => {
      const taskDate = new Date(task.scheduledDate);
      return taskDate >= rangeStart && taskDate <= rangeEnd;
    });

    const unplanned = tasksInRange.filter((t) => t.maintenanceStatus === "unplanned").length;
    const notAnswered = tasksInRange.filter((t) => t.maintenanceStatus === "not_answered").length;
    const contacted = tasksInRange.filter((t) => t.maintenanceStatus === "contacted").length;
    const planned = tasksInRange.filter((t) => t.maintenanceStatus === "planned").length;

    return {
      total: tasksInRange.length,
      unplanned,
      notAnswered,
      contacted,
      planned,
    };
  }, [tasks, startWeekIndex, endWeekIndex, availableWeeks]);

  const handleStartPlanning = () => {
    const startWeek = availableWeeks[startWeekIndex];
    const endWeek = availableWeeks[endWeekIndex];

    if (startWeek && endWeek && onStartPlanning) {
      onStartPlanning(startWeek.weekNumber, endWeek.weekNumber);
    }

    onOpenChange(false);
  };

  // Ensure end week is not before start week
  const handleStartWeekChange = (value: string) => {
    const newIndex = parseInt(value);
    setStartWeekIndex(newIndex);
    if (newIndex > endWeekIndex) {
      setEndWeekIndex(newIndex);
    }
  };

  const handleEndWeekChange = (value: string) => {
    const newIndex = parseInt(value);
    if (newIndex >= startWeekIndex) {
      setEndWeekIndex(newIndex);
    }
  };

  const startWeekLabel = availableWeeks[startWeekIndex]?.label || "";
  const endWeekLabel = availableWeeks[endWeekIndex]?.label || "";
  const weekCount = endWeekIndex - startWeekIndex + 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Neue Tourplanung
          </DialogTitle>
          <DialogDescription>
            Wählen Sie den Zeitraum für die automatische Routenoptimierung.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Week range selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Planungszeitraum</label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Select
                  value={startWeekIndex.toString()}
                  onValueChange={handleStartWeekChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Start KW" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWeeks.map((week, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {week.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-muted-foreground">bis</span>
              <div className="flex-1">
                <Select
                  value={endWeekIndex.toString()}
                  onValueChange={handleEndWeekChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ende KW" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWeeks.map((week, index) => (
                      <SelectItem
                        key={index}
                        value={index.toString()}
                        disabled={index < startWeekIndex}
                      >
                        {week.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Statistics card */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {startWeekLabel === endWeekLabel
                  ? startWeekLabel
                  : `${startWeekLabel} - ${endWeekLabel}`}
              </span>
              <span className="text-muted-foreground">
                ({weekCount} {weekCount === 1 ? "Woche" : "Wochen"})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted-foreground/40" />
                <span className="text-sm">
                  <span className="font-semibold">{stats.unplanned}</span>{" "}
                  <span className="text-muted-foreground">ungeplant</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm">
                  <span className="font-semibold">{stats.notAnswered}</span>{" "}
                  <span className="text-muted-foreground">nicht erreicht</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm">
                  <span className="font-semibold">{stats.contacted}</span>{" "}
                  <span className="text-muted-foreground">kontaktiert</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">
                  <span className="font-semibold">{stats.planned}</span>{" "}
                  <span className="text-muted-foreground">geplant</span>
                </span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Termine gesamt</span>
                <span className="text-lg font-semibold">{stats.total}</span>
              </div>
              {stats.unplanned > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.unplanned} Termine werden bei der Planung berücksichtigt
                </p>
              )}
            </div>
          </div>

          {/* Info text */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <div className="flex gap-2">
              <Route className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  Der Algorithmus weist Techniker basierend auf den Maschinentypen zu
                  und berechnet optimierte Routen pro Tag.
                </p>
                <p className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Techniker werden automatisch zugewiesen
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleStartPlanning} disabled={stats.total === 0}>
            <MapPin className="h-4 w-4 mr-2" />
            Planung starten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
