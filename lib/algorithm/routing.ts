import type { TravelLookup } from "@/lib/algorithm/travel-matrix";
import { travelKey } from "@/lib/algorithm/travel-matrix";

export interface RoutableStop {
  id: string;
  lat: number;
  lng: number;
  dauer_minuten: number;
}

export interface ScheduledStop extends RoutableStop {
  position: number;
  geplante_startzeit_mins: number; // minutes since midnight
  fahrtzeit_minuten: number;
}

function getDriveTime(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  matrix: TravelLookup,
  fallback = 30
): number {
  return matrix.get(travelKey(from.lat, from.lng, to.lat, to.lng))?.fahrtzeit_minuten ?? fallback;
}

export function nearestNeighborOrder(
  stops: RoutableStop[],
  startPoint: { lat: number; lng: number },
  matrix: TravelLookup
): RoutableStop[] {
  const unvisited = [...stops];
  const ordered: RoutableStop[] = [];
  let current: { lat: number; lng: number } = startPoint;

  while (unvisited.length > 0) {
    let bestIdx = 0;
    let bestTime = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const t = getDriveTime(current, unvisited[i]!, matrix);
      if (t < bestTime) { bestTime = t; bestIdx = i; }
    }
    ordered.push(unvisited[bestIdx]!);
    current = unvisited[bestIdx]!;
    unvisited.splice(bestIdx, 1);
  }
  return ordered;
}

export function calcArrivalTimes(
  orderedStops: RoutableStop[],
  startPoint: { lat: number; lng: number },
  routeStartMins: number,
  matrix: TravelLookup
): ScheduledStop[] {
  let current: { lat: number; lng: number } = startPoint;
  let elapsed = routeStartMins;
  return orderedStops.map((stop, i) => {
    const drive = getDriveTime(current, stop, matrix);
    elapsed += drive;
    const arrival = elapsed;
    elapsed += stop.dauer_minuten;
    current = stop;
    return { ...stop, position: i, geplante_startzeit_mins: arrival, fahrtzeit_minuten: drive };
  });
}

/** Format minutes-since-midnight as "HH:MM:SS" for Supabase time column */
export function minsToTimeString(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}
