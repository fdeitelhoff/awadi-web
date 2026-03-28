import type { GeoPoint } from "@/lib/algorithm/clustering";

export interface TechDaySlot {
  techniker_id: string;
  datum: string;
  centroid: { lat: number; lng: number };
  remaining_mins: number;
}

function geoDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  return Math.sqrt((a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2);
}

/** Find the best available slot (different technician) to cover an unscheduled plant.
 *  Requires remaining_mins >= plant.dauer_minuten.
 *  Picks the slot whose centroid is geographically nearest to the plant. */
export function findBestAlternativeTechnician(
  plant: GeoPoint,
  availableSlots: TechDaySlot[]
): TechDaySlot | null {
  const viable = availableSlots.filter(s => s.remaining_mins >= plant.dauer_minuten);
  if (viable.length === 0) return null;
  return viable.reduce((best, slot) =>
    geoDistance(slot.centroid, plant) < geoDistance(best.centroid, plant) ? slot : best
  );
}
