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
  CalendarViewMode,
  CalendarViewRange,
  MaintenanceTask,
  Technician,
} from "@/lib/types/maintenance";
import { ChevronLeft, ChevronRight, Columns3, RefreshCw, Rows3 } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { useEffect, useMemo, useState } from "react";
import { TechnicianTour, UnassignedTasks } from "./compact-task-card";

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

// Group tasks by technician
function groupTasksByTechnician(
  tasks: MaintenanceTask[]
): Map<string | null, MaintenanceTask[]> {
  const grouped = new Map<string | null, MaintenanceTask[]>();

  tasks.forEach((task) => {
    const techId = task.technicianId || null;
    if (!grouped.has(techId)) {
      grouped.set(techId, []);
    }
    grouped.get(techId)!.push(task);
  });

  return grouped;
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
  const [viewMode, setViewMode] = useState<CalendarViewMode>("columns");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [today, setToday] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  // Selected technicians filter - null means show all, Set means show only selected
  const [selectedTechnicianIds, setSelectedTechnicianIds] = useState<Set<string> | null>(null);
  // Also track if unassigned tasks should be shown
  const [showUnassigned, setShowUnassigned] = useState(true);

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
  const getTechnician = (technicianId: string): Technician | undefined => {
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

  // Toggle technician filter
  const toggleTechnician = (techId: string) => {
    setSelectedTechnicianIds((prev) => {
      if (prev === null) {
        // First click: select only this technician
        return new Set([techId]);
      }
      const newSet = new Set(prev);
      if (newSet.has(techId)) {
        newSet.delete(techId);
        // If no technicians selected, show all
        if (newSet.size === 0) {
          return null;
        }
      } else {
        newSet.add(techId);
      }
      return newSet;
    });
  };

  // Toggle unassigned tasks visibility
  const toggleUnassigned = () => {
    setShowUnassigned((prev) => !prev);
  };

  // Check if all technicians are shown (no filter active)
  const isShowingAll = selectedTechnicianIds === null && showUnassigned;

  // Show loading state during SSR/initial render (after all hooks)
  if (!isClient || startDate === null || today === null) {
    return (
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden items-center justify-center">
        <div className="text-muted-foreground">Laden...</div>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg">Wartungsplanung</CardTitle>
            {/* Technician legend - clickable filter */}
            <div className="hidden lg:flex items-center gap-1">
              {technicians.map((tech) => {
                const isSelected = selectedTechnicianIds === null || selectedTechnicianIds.has(tech.id);
                return (
                  <button
                    key={tech.id}
                    onClick={() => toggleTechnician(tech.id)}
                    className={`flex items-center gap-1 px-1.5 py-1 rounded transition-all hover:bg-muted ${
                      isSelected ? "opacity-100" : "opacity-40"
                    }`}
                    title={isSelected ? `${tech.name} ausblenden` : `${tech.name} einblenden`}
                  >
                    <div
                      className="w-3 h-3 rounded-full transition-transform"
                      style={{
                        backgroundColor: tech.color,
                        transform: isSelected ? "scale(1)" : "scale(0.8)"
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {tech.initials}
                    </span>
                  </button>
                );
              })}
              {/* Unassigned toggle */}
              <button
                onClick={toggleUnassigned}
                className={`flex items-center gap-1 px-1.5 py-1 rounded transition-all hover:bg-muted ${
                  showUnassigned ? "opacity-100" : "opacity-40"
                }`}
                title={showUnassigned ? "Nicht zugewiesene ausblenden" : "Nicht zugewiesene einblenden"}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-muted-foreground/40 transition-transform ${
                    showUnassigned ? "scale-100" : "scale-[0.8]"
                  }`}
                />
                <span className="text-xs text-muted-foreground">?</span>
              </button>
              {/* Reset filter button */}
              {!isShowingAll && (
                <button
                  onClick={() => {
                    setSelectedTechnicianIds(null);
                    setShowUnassigned(true);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground ml-1 px-1.5 py-1 rounded hover:bg-muted transition-colors"
                  title="Filter zurücksetzen"
                >
                  Alle
                </button>
              )}
            </div>
          </div>

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

            {/* View mode toggle */}
            <div className="flex items-center border rounded-md">
              <Toggle
                size="sm"
                pressed={viewMode === "columns"}
                onPressedChange={() => setViewMode("columns")}
                className="rounded-r-none data-[state=on]:bg-muted"
                aria-label="Spaltenansicht"
              >
                <Columns3 className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={viewMode === "rows"}
                onPressedChange={() => setViewMode("rows")}
                className="rounded-l-none data-[state=on]:bg-muted"
                aria-label="Zeilenansicht"
              >
                <Rows3 className="h-4 w-4" />
              </Toggle>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 pt-0 pb-2 px-3 overflow-hidden">
        {viewMode === "columns" ? (
          <ColumnsView
            weeks={weeks}
            weekDates={weekDates}
            tasksByDate={tasksByDate}
            today={today}
            getTechnician={getTechnician}
            selectedTechnicianIds={selectedTechnicianIds}
            showUnassigned={showUnassigned}
            onConfirmTask={onConfirmTask}
            onCancelTask={onCancelTask}
          />
        ) : (
          <RowsView
            weeks={weeks}
            weekDates={weekDates}
            tasksByDate={tasksByDate}
            today={today}
            getTechnician={getTechnician}
            selectedTechnicianIds={selectedTechnicianIds}
            showUnassigned={showUnassigned}
            onConfirmTask={onConfirmTask}
            onCancelTask={onCancelTask}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Shared props for view components
interface CalendarViewProps {
  weeks: number;
  weekDates: Date[][];
  tasksByDate: Map<string, MaintenanceTask[]>;
  today: Date;
  getTechnician: (technicianId: string) => Technician | undefined;
  selectedTechnicianIds: Set<string> | null;
  showUnassigned: boolean;
  onConfirmTask?: (taskId: string) => void;
  onCancelTask?: (taskId: string) => void;
}

// Columns View - Days as rows, weeks as columns (original layout)
function ColumnsView({
  weeks,
  weekDates,
  tasksByDate,
  today,
  getTechnician,
  selectedTechnicianIds,
  showUnassigned,
  onConfirmTask,
  onCancelTask,
}: CalendarViewProps) {
  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header row with week numbers */}
      <div
        className="grid gap-2 mb-2 shrink-0"
        style={{
          gridTemplateColumns: `40px repeat(${weeks}, 1fr)`,
        }}
      >
        <div className="text-xs font-medium text-muted-foreground flex items-center justify-center"></div>
        {weekDates.map((week, weekIndex) => (
          <div
            key={weekIndex}
            className="text-center bg-muted/50 rounded px-2 py-1.5"
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
      <ScrollArea className="flex-1 min-h-0">
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
                const dayTasks = tasksByDate.get(date.toDateString()) || [];
                const isTodayDate = isToday(date, today);

                // Group tasks by technician
                const tasksByTech = groupTasksByTechnician(dayTasks);
                // Filter technicians based on selection
                const assignedTechIds = Array.from(tasksByTech.keys()).filter(
                  (id) => id !== null && (selectedTechnicianIds === null || selectedTechnicianIds.has(id))
                ) as string[];
                const unassignedTasks = showUnassigned ? (tasksByTech.get(null) || []) : [];

                // Count visible tasks for display
                const visibleTaskCount = assignedTechIds.reduce(
                  (sum, id) => sum + (tasksByTech.get(id)?.length || 0),
                  unassignedTasks.length
                );

                return (
                  <div
                    key={weekIndex}
                    className={`min-h-[200px] rounded-lg border p-2 ${
                      isTodayDate
                        ? "bg-primary/10 border-primary"
                        : "bg-muted/20 border-border/50"
                    }`}
                  >
                    {/* Date header */}
                    <div
                      className={`text-xs mb-2 font-medium flex items-center justify-between ${
                        isTodayDate ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      <span>
                        {formatShortDate(date)}
                        {isTodayDate && (
                          <span className="ml-1.5 bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-[10px]">
                            Heute
                          </span>
                        )}
                      </span>
                      <span className="text-[10px]">
                        {visibleTaskCount} Termine
                      </span>
                    </div>

                    {/* Technician tours */}
                    {visibleTaskCount > 0 ? (
                      <div className="space-y-2">
                        {assignedTechIds.map((techId) => {
                          const tech = getTechnician(techId);
                          const techTasks = tasksByTech.get(techId) || [];
                          if (!tech) return null;

                          return (
                            <TechnicianTour
                              key={techId}
                              technician={tech}
                              tasks={techTasks}
                              onConfirm={onConfirmTask}
                              onCancel={onCancelTask}
                            />
                          );
                        })}

                        {/* Unassigned tasks */}
                        {showUnassigned && <UnassignedTasks tasks={unassignedTasks} />}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground/50 text-center py-8">
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
  );
}

// Rows View - Weeks as rows, days as columns
function RowsView({
  weekDates,
  tasksByDate,
  today,
  getTechnician,
  selectedTechnicianIds,
  showUnassigned,
  onConfirmTask,
  onCancelTask,
}: CalendarViewProps) {
  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header row with day names */}
      <div
        className="grid gap-2 mb-2 shrink-0"
        style={{
          gridTemplateColumns: `80px repeat(5, 1fr)`,
        }}
      >
        <div className="text-xs font-medium text-muted-foreground flex items-center justify-center"></div>
        {[0, 1, 2, 3, 4].map((dayIndex) => (
          <div
            key={dayIndex}
            className="text-center bg-muted/50 rounded px-2 py-1.5"
          >
            <div className="text-xs font-semibold">{WEEKDAY_NAMES[dayIndex]}</div>
          </div>
        ))}
      </div>

      {/* Scrollable week rows */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-3 pr-3">
          {/* For each week */}
          {weekDates.map((week, weekIndex) => (
            <div key={weekIndex} className="space-y-2">
              {/* Week header */}
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `80px repeat(5, 1fr)`,
                }}
              >
                {/* Week label */}
                <div className="bg-muted/50 rounded px-2 py-1.5 flex flex-col items-center justify-center">
                  <div className="text-xs font-semibold">
                    KW {getWeekNumber(week[0])}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatShortDate(week[0])} - {formatShortDate(week[4])}
                  </div>
                </div>

                {/* Cells for each day (Mon-Fri) */}
                {[0, 1, 2, 3, 4].map((dayIndex) => {
                  const date = week[dayIndex];
                  const dayTasks = tasksByDate.get(date.toDateString()) || [];
                  const isTodayDate = isToday(date, today);

                  // Group tasks by technician
                  const tasksByTech = groupTasksByTechnician(dayTasks);
                  // Filter technicians based on selection
                  const assignedTechIds = Array.from(tasksByTech.keys()).filter(
                    (id) => id !== null && (selectedTechnicianIds === null || selectedTechnicianIds.has(id))
                  ) as string[];
                  const unassignedTasks = showUnassigned ? (tasksByTech.get(null) || []) : [];

                  // Count visible tasks for display
                  const visibleTaskCount = assignedTechIds.reduce(
                    (sum, id) => sum + (tasksByTech.get(id)?.length || 0),
                    unassignedTasks.length
                  );

                  return (
                    <div
                      key={dayIndex}
                      className={`min-h-[160px] rounded-lg border p-2 ${
                        isTodayDate
                          ? "bg-primary/10 border-primary"
                          : "bg-muted/20 border-border/50"
                      }`}
                    >
                      {/* Date header */}
                      <div
                        className={`text-xs mb-2 font-medium flex items-center justify-between ${
                          isTodayDate ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        <span>
                          {formatShortDate(date)}
                          {isTodayDate && (
                            <span className="ml-1.5 bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-[10px]">
                              Heute
                            </span>
                          )}
                        </span>
                        <span className="text-[10px]">
                          {visibleTaskCount}
                        </span>
                      </div>

                      {/* Technician tours - more compact for row view */}
                      {visibleTaskCount > 0 ? (
                        <div className="space-y-1.5">
                          {assignedTechIds.map((techId) => {
                            const tech = getTechnician(techId);
                            const techTasks = tasksByTech.get(techId) || [];
                            if (!tech) return null;

                            return (
                              <CompactTechnicianTour
                                key={techId}
                                technician={tech}
                                tasks={techTasks}
                                onConfirm={onConfirmTask}
                                onCancel={onCancelTask}
                              />
                            );
                          })}

                          {/* Unassigned tasks */}
                          {showUnassigned && unassignedTasks.length > 0 && (
                            <CompactUnassignedTasks tasks={unassignedTasks} />
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground/50 text-center py-4">
                          —
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Compact technician tour for row view
interface CompactTechnicianTourProps {
  technician: Technician;
  tasks: MaintenanceTask[];
  onConfirm?: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
}

function CompactTechnicianTour({
  technician,
  tasks,
}: CompactTechnicianTourProps) {
  // Count confirmation statuses
  const confirmed = tasks.filter((t) => t.confirmationStatus === "confirmed").length;
  const pending = tasks.filter((t) => t.confirmationStatus === "pending").length;
  const tentative = tasks.filter((t) => t.confirmationStatus === "tentative").length;

  return (
    <div
      className="rounded border-l-2 bg-card/50 p-1.5 text-xs"
      style={{ borderLeftColor: technician.color }}
    >
      <div className="flex items-center gap-1.5">
        <div
          className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
          style={{ backgroundColor: technician.color }}
        >
          {technician.initials}
        </div>
        <span className="font-medium truncate flex-1">{tasks.length} Termine</span>
        {/* Status indicators */}
        <div className="flex items-center gap-0.5">
          {confirmed > 0 && (
            <span className="w-2 h-2 rounded-full bg-success" title={`${confirmed} bestätigt`} />
          )}
          {tentative > 0 && (
            <span className="w-2 h-2 rounded-full bg-warning" title={`${tentative} vorläufig`} />
          )}
          {pending > 0 && (
            <span className="w-2 h-2 rounded-full bg-muted-foreground/40" title={`${pending} offen`} />
          )}
        </div>
      </div>
    </div>
  );
}

// Compact unassigned tasks for row view
interface CompactUnassignedTasksProps {
  tasks: MaintenanceTask[];
}

function CompactUnassignedTasks({ tasks }: CompactUnassignedTasksProps) {
  return (
    <div className="rounded border-l-2 border-l-muted-foreground/30 bg-muted/30 p-1.5 text-xs">
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold bg-muted-foreground/30 text-muted-foreground shrink-0">
          ?
        </div>
        <span className="text-muted-foreground truncate">
          {tasks.length} nicht zugewiesen
        </span>
      </div>
    </div>
  );
}
