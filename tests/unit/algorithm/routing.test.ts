import { describe, it, expect } from "vitest";
import { nearestNeighborOrder, calcArrivalTimes, minsToTimeString, type RoutableStop } from "@/lib/algorithm/routing";
import type { TravelLookup } from "@/lib/algorithm/travel-matrix";
import { travelKey } from "@/lib/algorithm/travel-matrix";

const start = { lat: 51.0, lng: 9.0 };
const stops: RoutableStop[] = [
  { id: "s1", lat: 51.1, lng: 9.1, dauer_minuten: 60 },
  { id: "s2", lat: 51.5, lng: 9.5, dauer_minuten: 30 },
  { id: "s3", lat: 51.2, lng: 9.2, dauer_minuten: 45 },
];

// Build a simple mock travel lookup: distance-based 10 min per 0.1 degree
function buildMockMatrix(allPoints: Array<{lat:number;lng:number}>): TravelLookup {
  const map: TravelLookup = new Map();
  for (const a of allPoints) {
    for (const b of allPoints) {
      if (a === b) continue;
      const dist = Math.sqrt((a.lat-b.lat)**2 + (a.lng-b.lng)**2);
      map.set(travelKey(a.lat, a.lng, b.lat, b.lng), {
        fahrtzeit_minuten: Math.round(dist * 100),
      });
    }
  }
  return map;
}

describe("minsToTimeString", () => {
  it("formats midnight as 00:00:00", () => {
    expect(minsToTimeString(0)).toBe("00:00:00");
  });
  it("formats 480 as 08:00:00", () => {
    expect(minsToTimeString(480)).toBe("08:00:00");
  });
  it("formats 90 as 01:30:00", () => {
    expect(minsToTimeString(90)).toBe("01:30:00");
  });
});

describe("nearestNeighborOrder", () => {
  it("returns empty array for no stops", () => {
    const matrix: TravelLookup = new Map();
    expect(nearestNeighborOrder([], start, matrix)).toEqual([]);
  });

  it("visits all stops exactly once", () => {
    const matrix = buildMockMatrix([start, ...stops.map(s => ({ lat: s.lat, lng: s.lng }))]);
    const ordered = nearestNeighborOrder(stops, start, matrix);
    expect(ordered).toHaveLength(3);
    const ids = ordered.map(s => s.id).sort();
    expect(ids).toEqual(["s1", "s2", "s3"]);
  });

  it("visits nearest stop first from start", () => {
    const matrix = buildMockMatrix([start, ...stops.map(s => ({ lat: s.lat, lng: s.lng }))]);
    const ordered = nearestNeighborOrder(stops, start, matrix);
    // s1 is at 51.1,9.1 — closest to start at 51.0,9.0
    expect(ordered[0]!.id).toBe("s1");
  });

  it("handles single stop", () => {
    const matrix = buildMockMatrix([start, { lat: 51.1, lng: 9.1 }]);
    const ordered = nearestNeighborOrder([stops[0]!], start, matrix);
    expect(ordered).toHaveLength(1);
    expect(ordered[0]!.id).toBe("s1");
  });
});

describe("calcArrivalTimes", () => {
  it("calculates first stop arrival as route_start + drive_time", () => {
    const matrix = buildMockMatrix([start, ...stops.map(s => ({ lat: s.lat, lng: s.lng }))]);
    const ordered = nearestNeighborOrder([stops[0]!], start, matrix);
    const scheduled = calcArrivalTimes(ordered, start, 480, matrix); // 480 = 08:00
    expect(scheduled[0]!.geplante_startzeit_mins).toBeGreaterThanOrEqual(480);
  });
});
