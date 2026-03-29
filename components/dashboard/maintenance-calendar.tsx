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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarViewRange,
  MaintenanceStatus,
} from "@/lib/types/maintenance";
import type { KalenderTechniker, WartungsKalenderEintrag } from "@/lib/types/wartung";
import type { KundenStatus } from "@/lib/types/wartung";
import { ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { TourEintrag } from "@/lib/types/tour";
import { GeplantCard, TechnicianGeplantGruppe, TechnicianWartungsGruppe } from "./compact-task-card";
import { maintenanceStatusConfig } from "./status-badge";
import { TourPlanningDialogTrigger } from "@/components/dashboard/tour-planning-dialog-trigger";

const WINDOW_DAYS = 42; // 6 weeks

interface MaintenanceCalendarProps {
  techniker: KalenderTechniker[];
  wartungseintraege: WartungsKalenderEintrag[];
  publishedEintraege?: TourEintrag[];
  loadedWindow: { von: string; bis: string };
  onWindowChange: (von: string, bis: string) => void;
}

// kunden_status → MaintenanceStatus filter mapping
const KUNDEN_TO_FILTER: Record<KundenStatus, MaintenanceStatus | null> = {
  ausstehend:      "not_answered",
  email_versendet: "contacted",
  bestaetigt:      "planned",
  abgelehnt:       null,
};

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

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

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateKey(date: Date): string {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
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
  techniker,
  wartungseintraege,
  publishedEintraege = [],
  loadedWindow,
  onWindowChange,
}: MaintenanceCalendarProps) {
  const [viewRange, setViewRange] = useState<CalendarViewRange>("4weeks");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [today, setToday] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedTechnikerId, setSelectedTechnikerId] = useState<string>("all");
  const [selectedStatuses, setSelectedStatuses] = useState<Set<MaintenanceStatus>>(
    () => new Set(["unplanned", "not_answered", "contacted", "planned"] as MaintenanceStatus[])
  );

  useEffect(() => {
    const now = new Date();
    setIsClient(true);
    setToday(now);
    setStartDate(getStartOfWeek(now));
  }, []);

  const weeks = viewRangeToWeeks[viewRange];

  const weekDates = useMemo(
    () => (startDate ? getWeekDates(startDate, weeks) : []),
    [startDate, weeks]
  );

  // Group wartungseintraege by date
  const wartungByDate = useMemo(() => {
    const map = new Map<string, WartungsKalenderEintrag[]>();
    for (const e of wartungseintraege) {
      if (!map.has(e.datum)) map.set(e.datum, []);
      map.get(e.datum)!.push(e);
    }
    return map;
  }, [wartungseintraege]);

  // Group publishedEintraege by date
  const publishedByDate = useMemo(() => {
    const map = new Map<string, TourEintrag[]>();
    for (const e of publishedEintraege) {
      if (!map.has(e.datum)) map.set(e.datum, []);
      map.get(e.datum)!.push(e);
    }
    return map;
  }, [publishedEintraege]);

  function checkAndFetch(newStart: Date) {
    const newStartKey = toDateKey(newStart);
    // Look one week past the visible range so data is already loaded when the
    // user clicks "next" again.
    const lookAheadEnd = new Date(newStart);
    lookAheadEnd.setDate(newStart.getDate() + weeks * 7 + 7 - 1);
    const newEndKey = toDateKey(lookAheadEnd);
    if (newEndKey > loadedWindow.bis || newStartKey < loadedWindow.von) {
      const fetchBis = toDateKey(
        new Date(newStart.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000)
      );
      onWindowChange(newStartKey, fetchBis);
    }
  }

  const navigateWeeks = (direction: number) => {
    if (!startDate) return;
    const newStart = new Date(startDate);
    newStart.setDate(startDate.getDate() + direction * 7);
    setStartDate(newStart);
    checkAndFetch(newStart);
  };

  const goToToday = () => {
    const now = new Date();
    setToday(now);
    const newStart = getStartOfWeek(now);
    setStartDate(newStart);
    checkAndFetch(newStart);
  };

  const isShowingAllStatuses = selectedStatuses.size === 4;

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

            {/* Technician select */}
            <Select value={selectedTechnikerId} onValueChange={setSelectedTechnikerId}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Techniker</SelectItem>
                {techniker.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.farbe }} />
                      {t.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <div className="flex -space-x-1">
                    {(Object.keys(maintenanceStatusConfig) as MaintenanceStatus[]).slice(0, 3).map((s) => (
                      <div
                        key={s}
                        className={`w-3 h-3 rounded-full border border-background ${maintenanceStatusConfig[s].dotColor} ${selectedStatuses.has(s) ? "" : "opacity-30"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs">Status ({selectedStatuses.size})</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Sichtbarkeit</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(maintenanceStatusConfig) as MaintenanceStatus[]).map((status) => {
                  const cfg = maintenanceStatusConfig[status];
                  return (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={selectedStatuses.has(status)}
                      onCheckedChange={() => {
                        setSelectedStatuses((prev) => {
                          const next = new Set(prev);
                          if (next.has(status)) {
                            if (next.size > 1) next.delete(status);
                          } else {
                            next.add(status);
                          }
                          return next;
                        });
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${cfg.dotColor}`} />
                        <span>{cfg.label}</span>
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
            <TourPlanningDialogTrigger />
            <Button variant="outline" size="sm" onClick={goToToday} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Heute
            </Button>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeeks(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeeks(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Select value={viewRange} onValueChange={(v) => setViewRange(v as CalendarViewRange)}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {viewRangeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 pt-0 pb-2 px-3 overflow-hidden">
        <RowsView
          weeks={weeks}
          weekDates={weekDates}
          today={today}
          techniker={techniker}
          selectedTechnikerId={selectedTechnikerId}
          selectedStatuses={selectedStatuses}
          wartungByDate={wartungByDate}
          publishedByDate={publishedByDate}
        />
      </CardContent>
    </Card>
  );
}

interface RowsViewProps {
  weeks: number;
  weekDates: Date[][];
  today: Date;
  techniker: KalenderTechniker[];
  selectedTechnikerId: string;
  selectedStatuses: Set<MaintenanceStatus>;
  wartungByDate: Map<string, WartungsKalenderEintrag[]>;
  publishedByDate: Map<string, TourEintrag[]>;
}

function RowsView({
  weekDates,
  today,
  techniker,
  selectedTechnikerId,
  selectedStatuses,
  wartungByDate,
  publishedByDate,
}: RowsViewProps) {
  const techById = useMemo(
    () => new Map(techniker.map((t) => [t.id, t])),
    [techniker]
  );

  function getDayData(date: Date) {
    const key = toDateKey(date);

    // Ungeplante Wartungen — shown when "unplanned" filter is active
    const rawWartungen = selectedStatuses.has("unplanned") ? (wartungByDate.get(key) ?? []) : [];
    const filteredWartungen =
      selectedTechnikerId === "all"
        ? rawWartungen
        : rawWartungen.filter((e) => e.techniker_id === selectedTechnikerId);

    // Published tour entries — filter by technician + kunden_status
    const rawPublished = publishedByDate.get(key) ?? [];
    const filteredPublished = rawPublished.filter((e) => {
      if (selectedTechnikerId !== "all" && e.techniker_id !== selectedTechnikerId) return false;
      const filterKey = KUNDEN_TO_FILTER[e.kunden_status];
      return filterKey !== null && selectedStatuses.has(filterKey);
    });

    return { filteredWartungen, filteredPublished };
  }

  function countDay(date: Date): number {
    const { filteredWartungen, filteredPublished } = getDayData(date);
    return filteredWartungen.length + filteredPublished.length;
  }

  const dayTotals = [0, 1, 2, 3, 4].map((di) =>
    weekDates.reduce((sum, week) => sum + countDay(week[di]), 0)
  );
  const weekTotals = weekDates.map((week) =>
    [0, 1, 2, 3, 4].reduce((sum, di) => sum + countDay(week[di]), 0)
  );
  const overallTotal = weekTotals.reduce((s, n) => s + n, 0);

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="grid gap-2 mb-2 shrink-0" style={{ gridTemplateColumns: `80px repeat(5, 1fr)` }}>
        <div className="bg-primary/10 rounded px-2 py-1.5 flex flex-col items-center justify-center">
          <div className="text-lg font-bold text-primary">{overallTotal}</div>
          <div className="text-[10px] text-muted-foreground">Termine</div>
        </div>
        {[0, 1, 2, 3, 4].map((di) => (
          <div key={di} className="text-center bg-muted/50 rounded px-2 py-1.5">
            <div className="text-xs font-semibold">{WEEKDAY_NAMES[di]}</div>
            <div className="text-[10px] text-muted-foreground">{dayTotals[di]} Termine</div>
          </div>
        ))}
      </div>

      {/* Scrollable weeks */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-3 pr-3">
          {weekDates.map((week, wi) => (
            <div key={wi} className="space-y-2">
              <div className="grid gap-2" style={{ gridTemplateColumns: `80px repeat(5, 1fr)` }}>
                {/* Week label */}
                <div className="bg-muted/50 rounded px-2 py-1.5 flex flex-col items-center justify-center">
                  <div className="text-xs font-semibold">KW {getWeekNumber(week[0])}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatShortDate(week[0])} – {formatShortDate(week[4])}
                  </div>
                  <div className="text-xs font-medium text-primary mt-0.5">
                    {weekTotals[wi]} Termine
                  </div>
                </div>

                {/* Day cells Mon–Fri */}
                {[0, 1, 2, 3, 4].map((di) => {
                  const date = week[di];
                  const isTodayDate = isSameDay(date, today);
                  const { filteredWartungen, filteredPublished } = getDayData(date);
                  const total = filteredWartungen.length + filteredPublished.length;

                  // Group ungeplante Wartungen by technician
                  const wartungByTech = new Map<string, WartungsKalenderEintrag[]>();
                  const unassignedWartungen: WartungsKalenderEintrag[] = [];
                  for (const e of filteredWartungen) {
                    if (e.techniker_id) {
                      if (!wartungByTech.has(e.techniker_id)) wartungByTech.set(e.techniker_id, []);
                      wartungByTech.get(e.techniker_id)!.push(e);
                    } else {
                      unassignedWartungen.push(e);
                    }
                  }

                  // Group planned entries by technician (same pattern)
                  const publishedByTech = new Map<string, TourEintrag[]>();
                  const unassignedPublished: TourEintrag[] = [];
                  for (const e of filteredPublished) {
                    if (e.techniker_id) {
                      if (!publishedByTech.has(e.techniker_id)) publishedByTech.set(e.techniker_id, []);
                      publishedByTech.get(e.techniker_id)!.push(e);
                    } else {
                      unassignedPublished.push(e);
                    }
                  }

                  return (
                    <div
                      key={di}
                      className={`min-h-[160px] rounded-lg border p-2 ${
                        isTodayDate ? "bg-primary/10 border-primary" : "bg-muted/20 border-border/50"
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
                        <span className="text-[10px]">{total}</span>
                      </div>

                      {total > 0 ? (
                        <div className="space-y-1.5">
                          {/* Ungeplante Wartungen grouped by technician */}
                          {Array.from(wartungByTech.entries()).map(([techId, entries]) => {
                            const tech = techById.get(techId);
                            if (!tech) return null;
                            return (
                              <TechnicianWartungsGruppe
                                key={techId}
                                techniker={tech}
                                eintraege={entries}
                              />
                            );
                          })}
                          {/* Unassigned wartungen */}
                          {unassignedWartungen.length > 0 && (
                            <div className="rounded-lg border-l-4 border-l-muted-foreground/30 bg-muted/30 p-1.5">
                              <div className="text-[10px] font-medium text-muted-foreground mb-1 px-1">
                                Nicht zugewiesen ({unassignedWartungen.length})
                              </div>
                              {unassignedWartungen.map((e) => (
                                <div key={e.id} className="text-[11px] px-1 truncate">
                                  {e.anlage_name ?? `#${e.anlage_id}`}
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Published tour stops grouped by technician */}
                          {filteredPublished.length > 0 && (
                            <div className="space-y-1.5">
                              {Array.from(publishedByTech.entries()).map(([techId, entries]) => {
                                const tech = techById.get(techId);
                                if (!tech) return entries.map((e) => (
                                  <GeplantCard key={e.id} eintrag={e} />
                                ));
                                return (
                                  <TechnicianGeplantGruppe
                                    key={techId}
                                    techniker={tech}
                                    eintraege={entries}
                                  />
                                );
                              })}
                              {unassignedPublished.map((e) => (
                                <GeplantCard key={e.id} eintrag={e} />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground/50 text-center py-4">—</div>
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
