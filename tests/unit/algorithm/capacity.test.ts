import { describe, it, expect } from "vitest";
import {
  parseTimeToMins,
  calcAbsenceOverlap,
  buildCapacityMap,
} from "@/lib/algorithm/capacity";
import type { Profile } from "@/lib/types/profile";
import type { Abwesenheit } from "@/lib/types/abwesenheit";

const baseProfile: Profile = {
  id: "tech-1",
  email: "t@t.de",
  rollen_id: 2,
  aktiv: true,
  created_at: "2024-01-01T00:00:00Z",
  mo_von: "08:00",
  mo_bis: "17:00", // 540 min
  di_von: "08:00",
  di_bis: "17:00",
  mi_von: "08:00",
  mi_bis: "17:00",
  do_von: "08:00",
  do_bis: "17:00",
  fr_von: "08:00",
  fr_bis: "17:00",
};

describe("parseTimeToMins", () => {
  it("parses 08:00 → 480", () => expect(parseTimeToMins("08:00")).toBe(480));
  it("parses 17:00 → 1020", () => expect(parseTimeToMins("17:00")).toBe(1020));
  it("returns 0 for undefined", () =>
    expect(parseTimeToMins(undefined)).toBe(0));
});

describe("calcAbsenceOverlap", () => {
  it("full overlap returns full work window", () =>
    expect(calcAbsenceOverlap(480, 1020, 0, 1440)).toBe(540));
  it("partial overlap at start", () =>
    expect(calcAbsenceOverlap(480, 1020, 480, 720)).toBe(240));
  it("no overlap returns 0", () =>
    expect(calcAbsenceOverlap(480, 1020, 0, 480)).toBe(0));
});

describe("buildCapacityMap — no absences", () => {
  it("returns 540 available mins for a full Monday", () => {
    const map = buildCapacityMap([baseProfile], [], ["2026-03-30"]); // Monday
    expect(map["tech-1"]["2026-03-30"].available_mins).toBe(540);
    expect(map["tech-1"]["2026-03-30"].route_start_mins).toBe(480);
  });

  it("returns 0 for weekend day with no hours", () => {
    const map = buildCapacityMap([baseProfile], [], ["2026-03-29"]); // Sunday
    expect(map["tech-1"]["2026-03-29"].available_mins).toBe(0);
  });
});

describe("buildCapacityMap — with full-day absence", () => {
  const fullDayAbsence: Abwesenheit = {
    id: 1,
    user_id: "tech-1",
    typ: "Urlaub",
    von: "2026-03-30T00:00:00Z",
    bis: "2026-03-31T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
  };

  it("returns 0 available mins on absent day", () => {
    const map = buildCapacityMap([baseProfile], [fullDayAbsence], [
      "2026-03-30",
    ]);
    expect(map["tech-1"]["2026-03-30"].available_mins).toBe(0);
  });
});

describe("buildCapacityMap — with partial absence", () => {
  const morningAbsence: Abwesenheit = {
    id: 2,
    user_id: "tech-1",
    typ: "Arzt",
    von: "2026-03-30T08:00:00Z",
    bis: "2026-03-30T12:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
  };

  it("subtracts partial absence from capacity", () => {
    const map = buildCapacityMap([baseProfile], [morningAbsence], [
      "2026-03-30",
    ]);
    // 540 min - 240 min = 300 min
    expect(map["tech-1"]["2026-03-30"].available_mins).toBe(300);
  });

  it("sets route_start after partial morning absence", () => {
    const map = buildCapacityMap([baseProfile], [morningAbsence], [
      "2026-03-30",
    ]);
    expect(map["tech-1"]["2026-03-30"].route_start_mins).toBe(720); // 12:00
  });
});
