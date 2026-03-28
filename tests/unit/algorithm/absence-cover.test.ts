import { describe, it, expect } from "vitest";
import { findBestAlternativeTechnician, type TechDaySlot } from "@/lib/algorithm/absence-cover";
import type { GeoPoint } from "@/lib/algorithm/clustering";

const plant: GeoPoint = { id: "p1", lat: 51.0, lng: 9.0, dauer_minuten: 60 };

const slots: TechDaySlot[] = [
  { techniker_id: "t1", datum: "2026-03-30", centroid: { lat: 51.1, lng: 9.1 }, remaining_mins: 120 },
  { techniker_id: "t2", datum: "2026-03-31", centroid: { lat: 52.0, lng: 9.0 }, remaining_mins: 300 },
];

describe("findBestAlternativeTechnician", () => {
  it("returns the slot with nearest centroid", () => {
    const best = findBestAlternativeTechnician(plant, slots);
    expect(best?.techniker_id).toBe("t1");
  });

  it("returns null if no slots have enough capacity", () => {
    const tightSlots = slots.map(s => ({ ...s, remaining_mins: 30 }));
    const best = findBestAlternativeTechnician(plant, tightSlots);
    expect(best).toBeNull();
  });
});
