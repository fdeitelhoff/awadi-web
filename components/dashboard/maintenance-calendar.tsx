"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MaintenanceStatus,
  MaintenanceTask,
  Technician,
} from "@/lib/types/maintenance";
import { ChevronDown, ChevronLeft, ChevronRight, Columns3, MapPin, RefreshCw, Rows3 } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { useEffect, useMemo, useState } from "react";
import { TechnicianTour, UnassignedTasks } from "./compact-task-card";
import { maintenanceStatusConfig } from "./status-badge";

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
  // Default to first technician selected (more common use case: viewing one technician at a time)
  const [selectedTechnicianIds, setSelectedTechnicianIds] = useState<Set<string>>(
    () => new Set([technicians[0]?.id].filter(Boolean))
  );
  // Also track if unassigned tasks should be shown
  const [showUnassigned, setShowUnassigned] = useState(false);
  // Status filter - show all by default
  const [selectedStatuses, setSelectedStatuses] = useState<Set<MaintenanceStatus>>(
    () => new Set(["unplanned", "not_answered", "contacted", "planned"] as MaintenanceStatus[])
  );

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

  // Check if all statuses are shown
  const isShowingAllStatuses = selectedStatuses.size === 4;

  // Check if all technicians are shown (no filter active)
  const isShowingAll = selectedTechnicianIds.size === technicians.length && showUnassigned;

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
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Wartungsplanung</CardTitle>

            {/* Technician filter dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <div className="flex -space-x-1">
                    {technicians.slice(0, 3).map((tech) => (
                      <div
                        key={tech.id}
                        className={`w-3 h-3 rounded-full border border-background ${
                          selectedTechnicianIds.has(tech.id) ? "" : "opacity-30"
                        }`}
                        style={{ backgroundColor: tech.color }}
                      />
                    ))}
                  </div>
                  <span className="text-xs">
                    Techniker ({selectedTechnicianIds.size + (showUnassigned ? 1 : 0)})
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Techniker</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {technicians.map((tech) => (
                  <DropdownMenuCheckboxItem
                    key={tech.id}
                    checked={selectedTechnicianIds.has(tech.id)}
                    onCheckedChange={() => {
                      setSelectedTechnicianIds((prev) => {
                        const newSet = new Set(prev);
                        if (newSet.has(tech.id)) {
                          newSet.delete(tech.id);
                        } else {
                          newSet.add(tech.id);
                        }
                        return newSet;
                      });
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tech.color }}
                      />
                      <span>{tech.name}</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={showUnassigned}
                  onCheckedChange={() => setShowUnassigned(!showUnassigned)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
                    <span>Nicht zugewiesen</span>
                  </div>
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={isShowingAll}
                  onCheckedChange={() => {
                    if (isShowingAll) {
                      setSelectedTechnicianIds(new Set([technicians[0]?.id].filter(Boolean)));
                      setShowUnassigned(false);
                    } else {
                      setSelectedTechnicianIds(new Set(technicians.map((t) => t.id)));
                      setShowUnassigned(true);
                    }
                  }}
                >
                  Alle anzeigen
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status filter dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <div className="flex -space-x-1">
                    {(Object.keys(maintenanceStatusConfig) as MaintenanceStatus[]).slice(0, 3).map((status) => (
                      <div
                        key={status}
                        className={`w-3 h-3 rounded-full border border-background ${maintenanceStatusConfig[status].dotColor} ${
                          selectedStatuses.has(status) ? "" : "opacity-30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs">
                    Status ({selectedStatuses.size})
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(maintenanceStatusConfig) as MaintenanceStatus[]).map((status) => {
                  const config = maintenanceStatusConfig[status];
                  return (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={selectedStatuses.has(status)}
                      onCheckedChange={() => {
                        setSelectedStatuses((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(status)) {
                            if (newSet.size > 1) {
                              newSet.delete(status);
                            }
                          } else {
                            newSet.add(status);
                          }
                          return newSet;
                        });
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${config.dotColor}`} />
                        <span>{config.label}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={isShowingAllStatuses}
                  onCheckedChange={() => {
                    if (isShowingAllStatuses) {
                      setSelectedStatuses(new Set(["planned"]));
                    } else {
                      setSelectedStatuses(new Set(["unplanned", "not_answered", "contacted", "planned"]));
                    }
                  }}
                >
                  Alle anzeigen
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" className="gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Neue Tourplanung
            </Button>
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
            selectedStatuses={selectedStatuses}
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
            selectedStatuses={selectedStatuses}
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
  selectedTechnicianIds: Set<string>;
  showUnassigned: boolean;
  selectedStatuses: Set<MaintenanceStatus>;
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
  selectedStatuses,
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

                // Filter tasks by selected statuses
                const statusFilteredTasks = dayTasks.filter(t => selectedStatuses.has(t.maintenanceStatus));

                // Group tasks by technician
                const tasksByTech = groupTasksByTechnician(statusFilteredTasks);
                // Filter technicians based on selection
                const assignedTechIds = Array.from(tasksByTech.keys()).filter(
                  (id) => id !== null && selectedTechnicianIds.has(id)
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
  selectedStatuses,
  onConfirmTask,
  onCancelTask,
}: CalendarViewProps) {
  // Helper to count visible tasks for a specific date
  const countVisibleTasks = (date: Date): number => {
    const dayTasks = tasksByDate.get(date.toDateString()) || [];
    // Filter by selected statuses
    const statusFilteredTasks = dayTasks.filter(t => selectedStatuses.has(t.maintenanceStatus));
    const tasksByTech = groupTasksByTechnician(statusFilteredTasks);
    const assignedTechIds = Array.from(tasksByTech.keys()).filter(
      (id) => id !== null && selectedTechnicianIds.has(id)
    ) as string[];
    const unassignedTasks = showUnassigned ? (tasksByTech.get(null) || []) : [];
    return assignedTechIds.reduce(
      (sum, id) => sum + (tasksByTech.get(id)?.length || 0),
      unassignedTasks.length
    );
  };

  // Calculate totals per day of week (across all visible weeks)
  const dayTotals = [0, 1, 2, 3, 4].map((dayIndex) =>
    weekDates.reduce((sum, week) => sum + countVisibleTasks(week[dayIndex]), 0)
  );

  // Calculate totals per week
  const weekTotals = weekDates.map((week) =>
    [0, 1, 2, 3, 4].reduce((sum, dayIndex) => sum + countVisibleTasks(week[dayIndex]), 0)
  );

  // Calculate overall total
  const overallTotal = weekTotals.reduce((sum, weekTotal) => sum + weekTotal, 0);

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header row with day names and counts */}
      <div
        className="grid gap-2 mb-2 shrink-0"
        style={{
          gridTemplateColumns: `80px repeat(5, 1fr)`,
        }}
      >
        {/* Overall total in upper left */}
        <div className="bg-primary/10 rounded px-2 py-1.5 flex flex-col items-center justify-center">
          <div className="text-lg font-bold text-primary">{overallTotal}</div>
          <div className="text-[10px] text-muted-foreground">Termine</div>
        </div>
        {/* Day columns with totals */}
        {[0, 1, 2, 3, 4].map((dayIndex) => (
          <div
            key={dayIndex}
            className="text-center bg-muted/50 rounded px-2 py-1.5"
          >
            <div className="text-xs font-semibold">{WEEKDAY_NAMES[dayIndex]}</div>
            <div className="text-[10px] text-muted-foreground">{dayTotals[dayIndex]} Termine</div>
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
                {/* Week label with total */}
                <div className="bg-muted/50 rounded px-2 py-1.5 flex flex-col items-center justify-center">
                  <div className="text-xs font-semibold">
                    KW {getWeekNumber(week[0])}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatShortDate(week[0])} - {formatShortDate(week[4])}
                  </div>
                  <div className="text-xs font-medium text-primary mt-0.5">
                    {weekTotals[weekIndex]} Termine
                  </div>
                </div>

                {/* Cells for each day (Mon-Fri) */}
                {[0, 1, 2, 3, 4].map((dayIndex) => {
                  const date = week[dayIndex];
                  const dayTasks = tasksByDate.get(date.toDateString()) || [];
                  const isTodayDate = isToday(date, today);

                  // Filter tasks by selected statuses
                  const statusFilteredTasks = dayTasks.filter(t => selectedStatuses.has(t.maintenanceStatus));

                  // Group tasks by technician
                  const tasksByTech = groupTasksByTechnician(statusFilteredTasks);
                  // Filter technicians based on selection
                  const assignedTechIds = Array.from(tasksByTech.keys()).filter(
                    (id) => id !== null && selectedTechnicianIds.has(id)
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

                      {/* Technician tours - with full appointment details */}
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
