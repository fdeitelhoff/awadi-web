import type { Profile } from "@/lib/types/profile";
import type { Abwesenheit } from "@/lib/types/abwesenheit";

export interface DayCapacity {
  available_mins: number;
  route_start_mins: number; // minutes since midnight
}

export function parseTimeToMins(time: string | undefined): number {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function calcAbsenceOverlap(
  work_start: number,
  work_end: number,
  abs_start: number,
  abs_end: number
): number {
  return Math.max(0, Math.min(work_end, abs_end) - Math.max(work_start, abs_start));
}

const WEEKDAY_KEYS = ["so", "mo", "di", "mi", "do", "fr", "sa"] as const;
type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export function buildCapacityMap(
  profiles: Profile[],
  absences: Abwesenheit[],
  dates: string[]
): Record<string, Record<string, DayCapacity>> {
  const result: Record<string, Record<string, DayCapacity>> = {};

  for (const profile of profiles) {
    result[profile.id] = {};
    const techAbsences = absences.filter((a) => a.user_id === profile.id);

    for (const date of dates) {
      const dayIndex = new Date(date + "T12:00:00Z").getUTCDay();
      const key = WEEKDAY_KEYS[dayIndex] as WeekdayKey;
      const von = profile[`${key}_von` as keyof Profile] as
        | string
        | undefined;
      const bis = profile[`${key}_bis` as keyof Profile] as
        | string
        | undefined;
      const work_start = parseTimeToMins(von);
      const work_end = parseTimeToMins(bis);
      const working_mins =
        von && bis ? Math.max(0, work_end - work_start) : 0;

      if (working_mins === 0) {
        result[profile.id][date] = {
          available_mins: 0,
          route_start_mins: 0,
        };
        continue;
      }

      let total_absence = 0;
      let route_start = work_start;

      for (const abs of techAbsences) {
        const abs_from = new Date(abs.von);
        const abs_to = new Date(abs.bis);
        const day_start = new Date(date + "T00:00:00Z");
        const day_end = new Date(date + "T23:59:59.999Z");
        if (abs_to <= day_start || abs_from >= day_end) continue;

        const from_h = abs_from.getUTCHours(),
          from_m = abs_from.getUTCMinutes();
        const to_h = abs_to.getUTCHours(), to_m = abs_to.getUTCMinutes();
        const is_full_day =
          from_h === 0 && from_m === 0 && to_h === 0 && to_m === 0;

        if (is_full_day) {
          total_absence = working_mins;
          route_start = work_end;
        } else {
          const abs_start_mins = from_h * 60 + from_m;
          const abs_end_mins = to_h * 60 + to_m;
          total_absence += calcAbsenceOverlap(
            work_start,
            work_end,
            abs_start_mins,
            abs_end_mins
          );
          if (
            abs_end_mins > route_start &&
            abs_start_mins <= route_start
          ) {
            route_start = Math.min(work_end, abs_end_mins);
          }
        }
      }

      result[profile.id][date] = {
        available_mins: Math.max(0, working_mins - total_absence),
        route_start_mins: route_start,
      };
    }
  }

  return result;
}
