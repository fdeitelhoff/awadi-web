"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { technicians } from "@/lib/data/mock-data";
import {
  CalendarViewRange,
  MaintenanceTask,
  Technician,
} from "@/lib/types/maintenance";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CompactTaskCard } from "./compact-task-card";

interface MaintenanceCalendarProps {
  tasks: MaintenanceTask[];
  onConfirmTask?: (taskId: string) => void;
  onCancelTask?: (taskId: string) => void;
}

// Get week number
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Format short date
function formatShortDate(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
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

// Get dates for a given number of weeks
function getWeekDates(startDate: Date, weeks: number): Date[][] {
  const weekDates: Date[][] = [];
  const currentStart = getStartOfWeek(startDate);

  for (let w = 0; w < weeks; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(currentStart);
      date.setDate(currentStart.getDate() + w * 7 + d);
      week.push(date);
    }
    weekDates.push(week);
  }

  return weekDates;
}

// Check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Check if date is today
function isToday(date: Date, today: Date): boolean {
  return isSameDay(date, today);
}

const WEEKDAY_NAMES = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const viewRangeOptions: { value: CalendarViewRange; label: string }[] = [
  { value: "1week", label: "1 Woche" },
  { value: "2weeks", label: "2 Wochen" },
  { value: "3weeks", label: "3 Wochen" },
  { value: "4weeks", label: "4 Wochen" },
];

const viewRangeToWeeks: Record<CalendarViewRange, number> = {
  "1week": 1,
  "2weeks": 2,
  "3weeks": 3,
  "4weeks": 4,
};

export function MaintenanceCalendar({
  tasks,
  onConfirmTask,
  onCancelTask,
}: MaintenanceCalendarProps) {
  const [viewRange, setViewRange] = useState<CalendarViewRange>("4weeks");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [today, setToday] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Initialize dates on client side to avoid SSR/prerender issues
  useEffect(() => {
    const now = new Date();
    setIsClient(true);
    setToday(now);
    setStartDate(getStartOfWeek(now));
  }, []);

  const weeks = viewRangeToWeeks[viewRange];

  // All hooks must be called before any early returns
  const weekDates = useMemo(
    () => (startDate ? getWeekDates(startDate, weeks) : []),
    [startDate, weeks]
  );

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, MaintenanceTask[]>();
    tasks.forEach((task) => {
      const dateKey = task.scheduledDate.toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(task);
    });
    return grouped;
  }, [tasks]);

  // Get technician by ID
  const getTechnician = (technicianId?: string): Technician | undefined => {
    return technicians.find((t) => t.id === technicianId);
  };

  const navigateWeeks = (direction: number) => {
    if (!startDate) return;
    const newStart = new Date(startDate);
    newStart.setDate(startDate.getDate() + direction * 7);
    setStartDate(newStart);
  };

  const goToToday = () => {
    const now = new Date();
    setToday(now);
    setStartDate(getStartOfWeek(now));
  };

  // Show loading state during SSR/initial render (after all hooks)
  if (!isClient || startDate === null || today === null) {
    return (
      <Card className="flex-1 flex flex-col min-h-0 items-center justify-center">
        <div className="text-muted-foreground">Laden...</div>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-lg">Wartungsplanung</CardTitle>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Heute
            </Button>

            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigateWeeks(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigateWeeks(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Select
              value={viewRange}
              onValueChange={(v) => setViewRange(v as CalendarViewRange)}
            >
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {viewRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 pt-0 pb-2 px-3">
        <div className="h-full flex flex-col">
          {/* Header row with week numbers */}
          <div
            className="grid gap-2 mb-2 shrink-0"
            style={{
              gridTemplateColumns: `40px repeat(${weeks}, 1fr)`,
            }}
          >
            <div className="text-xs font-medium text-muted-foreground flex items-center justify-center">

            </div>
            {weekDates.map((week, weekIndex) => (
              <div
                key={weekIndex}
                className="text-center bg-muted/50 rounded px-2 py-1"
              >
                <div className="text-xs font-semibold">
                  KW {getWeekNumber(week[0])}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {formatShortDate(week[0])} - {formatShortDate(week[6])}
                </div>
              </div>
            ))}
          </div>

          {/* Scrollable day rows */}
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-3">
              {/* For each day of the week (0-4, Mon-Fri) */}
              {[0, 1, 2, 3, 4].map((dayIndex) => (
                <div
                  key={dayIndex}
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `40px repeat(${weeks}, 1fr)`,
                  }}
                >
                  {/* Day label */}
                  <div className="text-xs font-semibold text-muted-foreground flex items-start justify-center pt-3">
                    {WEEKDAY_NAMES[dayIndex]}
                  </div>

                  {/* Cells for each week */}
                  {weekDates.map((week, weekIndex) => {
                    const date = week[dayIndex];
                    const dayTasks =
                      tasksByDate.get(date.toDateString()) || [];
                    const isTodayDate = isToday(date, today);

                    return (
                      <div
                        key={weekIndex}
                        className={`min-h-[160px] rounded-lg border p-2 ${
                          isTodayDate
                            ? "bg-primary/10 border-primary"
                            : "bg-muted/20 border-border/50"
                        }`}
                      >
                        {/* Date header */}
                        <div
                          className={`text-xs mb-2 font-medium ${
                            isTodayDate
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatShortDate(date)}
                          {isTodayDate && (
                            <span className="ml-1.5 bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-[10px]">
                              Heute
                            </span>
                          )}
                        </div>

                        {/* Tasks */}
                        {dayTasks.length > 0 ? (
                          <div className="space-y-2">
                            {dayTasks.map((task) => (
                              <CompactTaskCard
                                key={task.id}
                                task={task}
                                technician={getTechnician(task.technicianId)}
                                onConfirm={onConfirmTask}
                                onCancel={onCancelTask}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground/50 text-center py-6">
                            Keine Termine
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
