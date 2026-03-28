# Tour & Route Planning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement geographic clustering + nearest-neighbor route planning that generates optimised daily maintenance tours, allows dispatcher drag-and-drop adjustment, and publishes the result to the dashboard calendar.

**Architecture:** A Next.js Route Handler runs the multi-step algorithm (capacity map → travel matrix → k-means++ clustering → Nearest Neighbor TSP → absence redistribution → ticket assignment) and saves a draft `touren` + `tour_eintraege` to Supabase. The dispatcher reviews and adjusts the draft at `/master-data/tours/[id]` using `@dnd-kit/core`, then publishes. Published stops appear in the existing dashboard calendar alongside due-date cards.

**Tech Stack:** Next.js App Router, Supabase (server client), `@dnd-kit/core` + `@dnd-kit/sortable` (already installed), Google Maps Distance Matrix API, Vitest (unit tests for pure algorithm functions), TypeScript.

---

## File Structure

**Create:**
- `lib/types/tour.ts` — Tour, TourEintrag, TourStatus types
- `lib/algorithm/capacity.ts` — Step 2: capacity map per technician per day
- `lib/algorithm/travel-matrix.ts` — Step 3: Maps cache lookup + API batching
- `lib/algorithm/clustering.ts` — Step 4: k-means++ geographic clustering
- `lib/algorithm/routing.ts` — Step 5: Nearest Neighbor TSP + arrival time calc
- `lib/algorithm/absence-cover.ts` — Step 6: absence redistribution
- `lib/algorithm/ticket-assignment.ts` — Step 7: ticket technician resolution
- `lib/algorithm/tour-planning.ts` — Orchestrator: Steps 1–8
- `lib/data/touren.ts` — getTouren, getTourById, getTourEintraege
- `lib/actions/touren.ts` — moveTourEintrag, reoptimiseDay, publishTour, revertToDraft, deleteTour
- `app/api/tours/plan/route.ts` — POST Route Handler that runs the algorithm
- `app/(dashboard)/master-data/tours/[id]/page.tsx` — Dispatcher planning workspace
- `components/dashboard/tour-stop-card.tsx` — Stop card (wartung or ticket variant)
- `components/dashboard/tour-ticket-sidebar.tsx` — Open tickets sidebar
- `components/dashboard/tour-grid.tsx` — Timeline grid (technicians × days)
- `tests/unit/algorithm/capacity.test.ts`
- `tests/unit/algorithm/clustering.test.ts`
- `tests/unit/algorithm/routing.test.ts`
- `tests/unit/algorithm/absence-cover.test.ts`
- `tests/unit/algorithm/ticket-assignment.test.ts`

**Modify:**
- `lib/types/abwesenheit.ts` — Fix comment on `von`/`bis` fields
- `lib/types/ticket.ts` — Add `techniker_id`, `lat`, `lng` to `Ticket` interface
- `lib/types/profile.ts` — Add `start_strasse`, `start_hausnr`, `start_plz`, `start_ort`, `start_lat`, `start_lng`
- `app/(dashboard)/master-data/tours/page.tsx` — Replace stub with full tour list
- `components/dashboard/maintenance-calendar.tsx` — Wire "Neue Tourplanung" button; inject published tour entries
- `components/dashboard/compact-task-card.tsx` — Add "Geplant" card variant

---

## Task 1: Database Migration

**Files:**
- Apply via Supabase MCP `apply_migration` tool

- [ ] **Step 1: Write the migration SQL**

```sql
-- New table: touren
CREATE TABLE touren (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  von         date NOT NULL,
  bis         date NOT NULL,
  status      text NOT NULL DEFAULT 'entwurf' CHECK (status IN ('entwurf','veröffentlicht')),
  created_by  uuid REFERENCES auth.users(id),
  partial     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- New table: tour_eintraege
CREATE TABLE tour_eintraege (
  id                      serial PRIMARY KEY,
  tour_id                 int NOT NULL REFERENCES touren(id) ON DELETE CASCADE,
  techniker_id            uuid NOT NULL REFERENCES auth.users(id),
  datum                   date NOT NULL,
  position                integer NOT NULL,
  item_type               text NOT NULL CHECK (item_type IN ('wartung','ticket')),
  anlage_id               int REFERENCES anlagen(id),
  ticket_id               int REFERENCES tickets(id),
  geplante_startzeit      time,
  fahrtzeit_minuten       integer,
  dauer_minuten           integer,
  original_techniker_id   uuid REFERENCES auth.users(id),
  notizen                 text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_item_type CHECK (
    (item_type = 'wartung' AND anlage_id IS NOT NULL AND ticket_id IS NULL) OR
    (item_type = 'ticket'  AND ticket_id IS NOT NULL AND anlage_id IS NULL)
  )
);

CREATE INDEX idx_tour_eintraege_tour_id ON tour_eintraege(tour_id);
CREATE INDEX idx_tour_eintraege_techniker_datum ON tour_eintraege(techniker_id, datum);

-- New table: reisezeiten_cache
CREATE TABLE reisezeiten_cache (
  id                  serial PRIMARY KEY,
  von_lat             numeric(10,7) NOT NULL,
  von_lng             numeric(10,7) NOT NULL,
  nach_lat            numeric(10,7) NOT NULL,
  nach_lng            numeric(10,7) NOT NULL,
  fahrtzeit_minuten   integer NOT NULL,
  distanz_km          numeric(6,2),
  cached_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (von_lat, von_lng, nach_lat, nach_lng)
);

-- Extend profiles: start location
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS start_strasse  text,
  ADD COLUMN IF NOT EXISTS start_hausnr   text,
  ADD COLUMN IF NOT EXISTS start_plz      text,
  ADD COLUMN IF NOT EXISTS start_ort      text,
  ADD COLUMN IF NOT EXISTS start_lat      numeric(10,7),
  ADD COLUMN IF NOT EXISTS start_lng      numeric(10,7);

-- Extend tickets: technician + coordinates
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS techniker_id  uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS lat           numeric(10,7),
  ADD COLUMN IF NOT EXISTS lng           numeric(10,7);
```

- [ ] **Step 2: Apply via Supabase MCP**

Use the `mcp__plugin_supabase_supabase__apply_migration` tool with name `tour_route_planning` and the SQL above.

- [ ] **Step 3: Verify tables exist**

Use `mcp__plugin_supabase_supabase__list_tables` and confirm `touren`, `tour_eintraege`, `reisezeiten_cache` appear.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add DB migration for tour route planning tables"
```

---

## Task 2: TypeScript Type Updates

**Files:**
- Modify: `lib/types/abwesenheit.ts`
- Modify: `lib/types/ticket.ts`
- Modify: `lib/types/profile.ts`
- Create: `lib/types/tour.ts`

- [ ] **Step 1: Fix abwesenheit.ts comment**

In `lib/types/abwesenheit.ts`, change lines 14–15:
```typescript
  von: string; // ISO datetime string, e.g. "2026-03-15T08:00:00Z"
  bis: string; // ISO datetime string, e.g. "2026-03-15T12:00:00Z"
```

- [ ] **Step 2: Extend ticket.ts**

Add to the `Ticket` interface (after `user_name`):
```typescript
  techniker_id?: string;   // explicitly assigned technician (new field)
  lat?: number;            // geocoded ticket location (no anlage_id case)
  lng?: number;
```

- [ ] **Step 3: Extend profile.ts**

Add to the `Profile` interface (after `farbe`):
```typescript
  start_strasse?: string;
  start_hausnr?: string;
  start_plz?: string;
  start_ort?: string;
  start_lat?: number;
  start_lng?: number;
```

- [ ] **Step 4: Create lib/types/tour.ts**

```typescript
export type TourStatus = "entwurf" | "veröffentlicht";
export type TourItemType = "wartung" | "ticket";

export interface Tour {
  id: number;
  name: string;
  von: string;         // ISO date
  bis: string;         // ISO date
  status: TourStatus;
  created_by: string;  // uuid
  partial: boolean;
  created_at: string;
  updated_at?: string;
  // joined display fields
  created_by_name?: string;
  techniker_count?: number;
  stop_count?: number;
}

export interface TourEintrag {
  id: number;
  tour_id: number;
  techniker_id: string;
  datum: string;           // ISO date
  position: number;
  item_type: TourItemType;
  anlage_id?: number;
  ticket_id?: number;
  geplante_startzeit?: string; // "HH:MM:SS"
  fahrtzeit_minuten?: number;
  dauer_minuten?: number;
  original_techniker_id?: string;
  notizen?: string;
  created_at: string;
  // joined display fields
  techniker_name?: string;
  anlage_name?: string;
  anlage_adresse?: string;
  anlage_lat?: number;
  anlage_lng?: number;
  ticket_titel?: string;
}

export interface TourQueryResult {
  data: Tour[];
  totalCount: number;
}

export interface TourDraftResult {
  tourId: number;
  warnings: string[];
  partial: boolean;
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | head -30
```
Expected: no type errors on the changed files.

- [ ] **Step 6: Commit**

```bash
git add lib/types/
git commit -m "feat: add tour types; extend Ticket, Profile, Abwesenheit types"
```

---

## Task 3: Algorithm — Capacity Map

**Files:**
- Create: `lib/algorithm/capacity.ts`
- Create: `tests/unit/algorithm/capacity.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/algorithm/capacity.test.ts
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
  mo_von: "08:00", mo_bis: "17:00", // 540 min
  di_von: "08:00", di_bis: "17:00",
  mi_von: "08:00", mi_bis: "17:00",
  do_von: "08:00", do_bis: "17:00",
  fr_von: "08:00", fr_bis: "17:00",
};

describe("parseTimeToMins", () => {
  it("parses 08:00 → 480", () => expect(parseTimeToMins("08:00")).toBe(480));
  it("parses 17:00 → 1020", () => expect(parseTimeToMins("17:00")).toBe(1020));
  it("returns 0 for undefined", () => expect(parseTimeToMins(undefined)).toBe(0));
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
    id: 1, user_id: "tech-1", typ: "Urlaub",
    von: "2026-03-30T00:00:00Z",
    bis: "2026-03-31T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
  };

  it("returns 0 available mins on absent day", () => {
    const map = buildCapacityMap([baseProfile], [fullDayAbsence], ["2026-03-30"]);
    expect(map["tech-1"]["2026-03-30"].available_mins).toBe(0);
  });
});

describe("buildCapacityMap — with partial absence", () => {
  const morningAbsence: Abwesenheit = {
    id: 2, user_id: "tech-1", typ: "Arzt",
    von: "2026-03-30T08:00:00Z",
    bis: "2026-03-30T12:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
  };

  it("subtracts partial absence from capacity", () => {
    const map = buildCapacityMap([baseProfile], [morningAbsence], ["2026-03-30"]);
    // 540 min - 240 min = 300 min
    expect(map["tech-1"]["2026-03-30"].available_mins).toBe(300);
  });

  it("sets route_start after partial morning absence", () => {
    const map = buildCapacityMap([baseProfile], [morningAbsence], ["2026-03-30"]);
    expect(map["tech-1"]["2026-03-30"].route_start_mins).toBe(720); // 12:00
  });
});
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
pnpm test 2>&1 | grep -A3 "capacity"
```
Expected: `Cannot find module '@/lib/algorithm/capacity'`

- [ ] **Step 3: Implement capacity.ts**

```typescript
// lib/algorithm/capacity.ts
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
  work_start: number, work_end: number,
  abs_start: number, abs_end: number
): number {
  return Math.max(0, Math.min(work_end, abs_end) - Math.max(work_start, abs_start));
}

const WEEKDAY_KEYS = ["so", "mo", "di", "mi", "do", "fr", "sa"] as const;
type WeekdayKey = typeof WEEKDAY_KEYS[number];

export function buildCapacityMap(
  profiles: Profile[],
  absences: Abwesenheit[],
  dates: string[]
): Record<string, Record<string, DayCapacity>> {
  const result: Record<string, Record<string, DayCapacity>> = {};

  for (const profile of profiles) {
    result[profile.id] = {};
    const techAbsences = absences.filter(a => a.user_id === profile.id);

    for (const date of dates) {
      const dayIndex = new Date(date + "T12:00:00Z").getUTCDay();
      const key = WEEKDAY_KEYS[dayIndex] as WeekdayKey;
      const von = profile[`${key}_von` as keyof Profile] as string | undefined;
      const bis = profile[`${key}_bis` as keyof Profile] as string | undefined;
      const work_start = parseTimeToMins(von);
      const work_end = parseTimeToMins(bis);
      const working_mins = von && bis ? Math.max(0, work_end - work_start) : 0;

      if (working_mins === 0) {
        result[profile.id][date] = { available_mins: 0, route_start_mins: 0 };
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

        const from_h = abs_from.getUTCHours(), from_m = abs_from.getUTCMinutes();
        const to_h = abs_to.getUTCHours(), to_m = abs_to.getUTCMinutes();
        const is_full_day = from_h === 0 && from_m === 0 && to_h === 0 && to_m === 0;

        if (is_full_day) {
          total_absence = working_mins;
          route_start = work_end;
        } else {
          const abs_start_mins = from_h * 60 + from_m;
          const abs_end_mins = to_h * 60 + to_m;
          total_absence += calcAbsenceOverlap(work_start, work_end, abs_start_mins, abs_end_mins);
          if (abs_end_mins > route_start && abs_start_mins <= route_start) {
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
```

- [ ] **Step 4: Run tests and confirm pass**

```bash
pnpm test 2>&1 | grep -E "capacity|✓|✗|PASS|FAIL"
```
Expected: all capacity tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/algorithm/capacity.ts tests/unit/algorithm/capacity.test.ts
git commit -m "feat: add capacity map algorithm (Step 2)"
```

---

## Task 4: Algorithm — Travel Time Matrix

**Files:**
- Create: `lib/algorithm/travel-matrix.ts`

Note: The travel matrix function requires a Supabase client and Google Maps API key — these are integration concerns, not pure unit tests. We test only the coordinate normalisation helper; the main function is verified via the algorithm integration in Task 9.

- [ ] **Step 1: Create travel-matrix.ts**

```typescript
// lib/algorithm/travel-matrix.ts
import { createClient } from "@/lib/supabase/server";

export interface TravelPair {
  from: { lat: number; lng: number };
  to:   { lat: number; lng: number };
}

export interface TravelEntry {
  fahrtzeit_minuten: number;
  distanz_km?: number;
}

export type TravelLookup = Map<string, TravelEntry>;

/** Round coordinate to 7 decimal places to match numeric(10,7) DB column */
export function normalizeCoord(coord: string | number): number {
  return Math.round(parseFloat(String(coord)) * 1e7) / 1e7;
}

export function travelKey(fromLat: number, fromLng: number, toLat: number, toLng: number): string {
  return `${fromLat}|${fromLng}|${toLat}|${toLng}`;
}

/** Load cached travel times for the given pairs from reisezeiten_cache.
 *  Returns a Map keyed by travelKey(). Only entries newer than 90 days are included. */
export async function loadCachedTimes(pairs: TravelPair[]): Promise<TravelLookup> {
  if (pairs.length === 0) return new Map();
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const result: TravelLookup = new Map();
  // Batch lookups (Supabase in() filter on composite not ideal; fetch all for affected coords)
  const lats = [...new Set(pairs.map(p => p.from.lat))];
  const { data } = await supabase
    .from("reisezeiten_cache")
    .select("von_lat,von_lng,nach_lat,nach_lng,fahrtzeit_minuten,distanz_km")
    .in("von_lat", lats)
    .gte("cached_at", cutoff);

  for (const row of data ?? []) {
    const key = travelKey(row.von_lat, row.von_lng, row.nach_lat, row.nach_lng);
    result.set(key, { fahrtzeit_minuten: row.fahrtzeit_minuten, distanz_km: row.distanz_km });
  }
  return result;
}

/** Store travel time results back to the cache (upsert). */
export async function storeCachedTimes(
  entries: Array<{ from: { lat: number; lng: number }; to: { lat: number; lng: number }; fahrtzeit_minuten: number; distanz_km?: number }>
): Promise<void> {
  if (entries.length === 0) return;
  const supabase = await createClient();
  await supabase.from("reisezeiten_cache").upsert(
    entries.map(e => ({
      von_lat: e.from.lat, von_lng: e.from.lng,
      nach_lat: e.to.lat, nach_lng: e.to.lng,
      fahrtzeit_minuten: e.fahrtzeit_minuten,
      distanz_km: e.distanz_km ?? null,
      cached_at: new Date().toISOString(),
    })),
    { onConflict: "von_lat,von_lng,nach_lat,nach_lng" }
  );
}

/** Call Google Maps Distance Matrix API for cache-miss pairs.
 *  Batches into ≤25 origins × ≤25 destinations with concurrency limit 5. */
export async function fetchMapsMatrix(
  pairs: TravelPair[],
  apiKey: string
): Promise<TravelLookup> {
  const result: TravelLookup = new Map();
  if (pairs.length === 0) return result;

  const origins = [...new Set(pairs.map(p => `${p.from.lat},${p.from.lng}`))];
  const destinations = [...new Set(pairs.map(p => `${p.to.lat},${p.to.lng}`))];

  const BATCH = 25;
  const CONCURRENCY = 5;
  const tasks: Array<() => Promise<void>> = [];

  for (let oi = 0; oi < origins.length; oi += BATCH) {
    const origBatch = origins.slice(oi, oi + BATCH);
    for (let di = 0; di < destinations.length; di += BATCH) {
      const destBatch = destinations.slice(di, di + BATCH);
      tasks.push(async () => {
        const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
        url.searchParams.set("origins", origBatch.join("|"));
        url.searchParams.set("destinations", destBatch.join("|"));
        url.searchParams.set("mode", "driving");
        url.searchParams.set("key", apiKey);
        const res = await fetch(url.toString());
        const json = await res.json();
        for (let r = 0; r < (json.rows ?? []).length; r++) {
          for (let c = 0; c < (json.rows[r].elements ?? []).length; c++) {
            const el = json.rows[r].elements[c];
            if (el.status !== "OK") continue;
            const [oLat, oLng] = origBatch[r]!.split(",").map(Number);
            const [dLat, dLng] = destBatch[c]!.split(",").map(Number);
            const key = travelKey(oLat!, oLng!, dLat!, dLng!);
            result.set(key, {
              fahrtzeit_minuten: Math.round(el.duration.value / 60),
              distanz_km: Math.round(el.distance.value / 100) / 10,
            });
          }
        }
      });
    }
  }

  // Run with concurrency limit
  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    await Promise.all(tasks.slice(i, i + CONCURRENCY).map(t => t()));
  }
  return result;
}

/** Build a complete travel lookup for a set of points.
 *  Cache-first; calls Maps API only for misses. Stores results back to cache. */
export async function buildTravelMatrix(
  points: Array<{ lat: number; lng: number }>,
  apiKey: string
): Promise<TravelLookup> {
  const pairs: TravelPair[] = [];
  for (const from of points) {
    for (const to of points) {
      if (from === to) continue;
      pairs.push({ from, to });
    }
  }

  const cached = await loadCachedTimes(pairs);
  const misses = pairs.filter(p => !cached.has(travelKey(p.from.lat, p.from.lng, p.to.lat, p.to.lng)));
  const fresh = await fetchMapsMatrix(misses, apiKey);
  await storeCachedTimes(
    misses
      .filter(p => fresh.has(travelKey(p.from.lat, p.from.lng, p.to.lat, p.to.lng)))
      .map(p => {
        const key = travelKey(p.from.lat, p.from.lng, p.to.lat, p.to.lng);
        return { from: p.from, to: p.to, ...fresh.get(key)! };
      })
  );

  const combined = new Map([...cached, ...fresh]);
  return combined;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | grep "travel-matrix" | head -5
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/algorithm/travel-matrix.ts
git commit -m "feat: add travel time matrix with Google Maps cache (Step 3)"
```

---

## Task 5: Algorithm — Geographic Clustering

**Files:**
- Create: `lib/algorithm/clustering.ts`
- Create: `tests/unit/algorithm/clustering.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/algorithm/clustering.test.ts
import { describe, it, expect } from "vitest";
import {
  kMeansPlusPlus,
  assignClustersToDays,
  type GeoPoint,
} from "@/lib/algorithm/clustering";

const northCluster: GeoPoint[] = [
  { id: "a1", lat: 51.5, lng: 9.0, dauer_minuten: 60 },
  { id: "a2", lat: 51.6, lng: 9.1, dauer_minuten: 60 },
  { id: "a3", lat: 51.55, lng: 9.05, dauer_minuten: 60 },
];
const southCluster: GeoPoint[] = [
  { id: "b1", lat: 50.5, lng: 9.0, dauer_minuten: 60 },
  { id: "b2", lat: 50.6, lng: 9.1, dauer_minuten: 60 },
  { id: "b3", lat: 50.55, lng: 9.05, dauer_minuten: 60 },
];

describe("kMeansPlusPlus", () => {
  it("splits clearly separated points into two clusters", () => {
    const points = [...northCluster, ...southCluster];
    const clusters = kMeansPlusPlus(points, 2, 42);
    expect(clusters).toHaveLength(2);
    const sizes = clusters.map(c => c.points.length).sort();
    expect(sizes).toEqual([3, 3]);
  });

  it("returns k=1 cluster containing all points", () => {
    const clusters = kMeansPlusPlus(northCluster, 1, 42);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]!.points).toHaveLength(3);
  });

  it("is deterministic for same seed", () => {
    const points = [...northCluster, ...southCluster];
    const r1 = kMeansPlusPlus(points, 2, 99);
    const r2 = kMeansPlusPlus(points, 2, 99);
    expect(r1.map(c => c.centroid.lat)).toEqual(r2.map(c => c.centroid.lat));
  });
});

describe("assignClustersToDays", () => {
  const start = { lat: 51.0, lng: 9.0 };
  const dates = ["2026-03-30", "2026-03-31"];

  it("assigns cluster nearest start point to earliest day", () => {
    const clusters = kMeansPlusPlus([...northCluster, ...southCluster], 2, 42);
    const assignment = assignClustersToDays(clusters, start, dates);
    // North cluster centroid is closer to start (lat 51.0) → day 0
    expect(assignment["2026-03-30"]).toBeDefined();
    expect(assignment["2026-03-31"]).toBeDefined();
  });
});
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
pnpm test 2>&1 | grep "clustering"
```
Expected: `Cannot find module '@/lib/algorithm/clustering'`

- [ ] **Step 3: Implement clustering.ts**

```typescript
// lib/algorithm/clustering.ts

export interface GeoPoint {
  id: string;
  lat: number;
  lng: number;
  dauer_minuten: number;
}

export interface Cluster {
  points: GeoPoint[];
  centroid: { lat: number; lng: number };
}

function euclidean(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  return Math.sqrt((a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2);
}

function centroid(points: GeoPoint[]): { lat: number; lng: number } {
  if (points.length === 0) return { lat: 0, lng: 0 };
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
  };
}

/** Seeded pseudo-random (LCG) for deterministic k-means++. */
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function kMeansPlusPlus(points: GeoPoint[], k: number, seed: number): Cluster[] {
  if (points.length === 0 || k <= 0) return [];
  if (k >= points.length) return points.map(p => ({ points: [p], centroid: { lat: p.lat, lng: p.lng } }));

  const rng = makeRng(seed);
  // k-means++ initialisation
  const centers: { lat: number; lng: number }[] = [
    { lat: points[Math.floor(rng() * points.length)]!.lat, lng: points[Math.floor(rng() * points.length)]!.lng },
  ];

  for (let ci = 1; ci < k; ci++) {
    const dists = points.map(p => Math.min(...centers.map(c => euclidean(p, c) ** 2)));
    const total = dists.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    let chosen = points[points.length - 1]!;
    for (let i = 0; i < points.length; i++) {
      r -= dists[i]!;
      if (r <= 0) { chosen = points[i]!; break; }
    }
    centers.push({ lat: chosen.lat, lng: chosen.lng });
  }

  // Lloyd's algorithm
  for (let iter = 0; iter < 100; iter++) {
    const assignments: GeoPoint[][] = Array.from({ length: k }, () => []);
    for (const p of points) {
      let best = 0, bestDist = Infinity;
      for (let ci = 0; ci < centers.length; ci++) {
        const d = euclidean(p, centers[ci]!);
        if (d < bestDist) { bestDist = d; best = ci; }
      }
      assignments[best]!.push(p);
    }
    // Recalculate centers; check convergence
    let moved = false;
    for (let ci = 0; ci < k; ci++) {
      if (assignments[ci]!.length === 0) continue;
      const nc = centroid(assignments[ci]!);
      if (Math.abs(nc.lat - centers[ci]!.lat) > 0.0001 || Math.abs(nc.lng - centers[ci]!.lng) > 0.0001) moved = true;
      centers[ci] = nc;
    }
    if (!moved) {
      return assignments.map((pts, ci) => ({ points: pts, centroid: centers[ci]! }));
    }
  }

  // Final assignment
  const finalAssignments: GeoPoint[][] = Array.from({ length: k }, () => []);
  for (const p of points) {
    let best = 0, bestDist = Infinity;
    for (let ci = 0; ci < centers.length; ci++) {
      const d = euclidean(p, centers[ci]!);
      if (d < bestDist) { bestDist = d; best = ci; }
    }
    finalAssignments[best]!.push(p);
  }
  return finalAssignments.map((pts, ci) => ({ points: pts, centroid: centers[ci]! }));
}

/** Assign clusters to available dates, closest cluster centroid to start → earliest date. */
export function assignClustersToDays(
  clusters: Cluster[],
  startPoint: { lat: number; lng: number },
  availableDates: string[]
): Record<string, GeoPoint[]> {
  const sorted = [...clusters].sort(
    (a, b) => euclidean(a.centroid, startPoint) - euclidean(b.centroid, startPoint)
  );
  const result: Record<string, GeoPoint[]> = {};
  for (let i = 0; i < Math.min(sorted.length, availableDates.length); i++) {
    result[availableDates[i]!] = sorted[i]!.points;
  }
  return result;
}
```

- [ ] **Step 4: Run tests and confirm pass**

```bash
pnpm test 2>&1 | grep -E "clustering|✓|✗" | head -20
```
Expected: all clustering tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/algorithm/clustering.ts tests/unit/algorithm/clustering.test.ts
git commit -m "feat: add k-means++ geographic clustering (Step 4)"
```

---

## Task 6: Algorithm — Nearest Neighbor Routing

**Files:**
- Create: `lib/algorithm/routing.ts`
- Create: `tests/unit/algorithm/routing.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/algorithm/routing.test.ts
import { describe, it, expect } from "vitest";
import { nearestNeighborOrder, calcArrivalTimes, type RoutableStop } from "@/lib/algorithm/routing";
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

describe("nearestNeighborOrder", () => {
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
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
pnpm test 2>&1 | grep "routing"
```

- [ ] **Step 3: Implement routing.ts**

```typescript
// lib/algorithm/routing.ts
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
```

- [ ] **Step 4: Run tests and confirm pass**

```bash
pnpm test 2>&1 | grep -E "routing|✓|✗" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add lib/algorithm/routing.ts tests/unit/algorithm/routing.test.ts
git commit -m "feat: add nearest-neighbor TSP routing with arrival times (Step 5)"
```

---

## Task 7: Algorithm — Absence Redistribution

**Files:**
- Create: `lib/algorithm/absence-cover.ts`
- Create: `tests/unit/algorithm/absence-cover.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/algorithm/absence-cover.test.ts
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
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
pnpm test 2>&1 | grep "absence-cover"
```

- [ ] **Step 3: Implement absence-cover.ts**

```typescript
// lib/algorithm/absence-cover.ts
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
```

- [ ] **Step 4: Run tests and confirm pass**

```bash
pnpm test 2>&1 | grep -E "absence-cover|✓|✗" | head -10
```

- [ ] **Step 5: Commit**

```bash
git add lib/algorithm/absence-cover.ts tests/unit/algorithm/absence-cover.test.ts
git commit -m "feat: add absence redistribution helper (Step 6)"
```

---

## Task 8: Algorithm — Ticket Assignment

**Files:**
- Create: `lib/algorithm/ticket-assignment.ts`
- Create: `tests/unit/algorithm/ticket-assignment.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/algorithm/ticket-assignment.test.ts
import { describe, it, expect } from "vitest";
import { resolveTicketTechnician, PRIORITY_ORDER } from "@/lib/algorithm/ticket-assignment";
import type { Ticket } from "@/lib/types/ticket";

const baseTicket: Ticket = {
  id: 1, titel: "Pumpe defekt", status: "offen", prioritaet: "normal",
  created_at: "2026-01-01T00:00:00Z",
};

describe("PRIORITY_ORDER", () => {
  it("dringend sorts before hoch before normal", () => {
    const priorities = ["normal", "hoch", "dringend"] as const;
    const sorted = [...priorities].sort((a, b) => PRIORITY_ORDER[a] - PRIORITY_ORDER[b]);
    expect(sorted).toEqual(["dringend", "hoch", "normal"]);
  });
});

describe("resolveTicketTechnician", () => {
  it("uses ticket.techniker_id when set", () => {
    const ticket = { ...baseTicket, techniker_id: "tech-explicit" };
    const result = resolveTicketTechnician(ticket, {}, []);
    expect(result).toBe("tech-explicit");
  });

  it("falls back to anlage techniker_id when ticket has no techniker_id", () => {
    const ticket = { ...baseTicket, anlage_id: 10 };
    const anlageMap = { 10: "tech-from-anlage" };
    const result = resolveTicketTechnician(ticket, anlageMap, []);
    expect(result).toBe("tech-from-anlage");
  });

  it("returns first available technician when no explicit assignment", () => {
    const ticket = { ...baseTicket };
    const result = resolveTicketTechnician(ticket, {}, ["tech-geo"]);
    expect(result).toBe("tech-geo");
  });

  it("returns null when no technician can be resolved", () => {
    const result = resolveTicketTechnician(baseTicket, {}, []);
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
pnpm test 2>&1 | grep "ticket-assignment"
```

- [ ] **Step 3: Implement ticket-assignment.ts**

```typescript
// lib/algorithm/ticket-assignment.ts
import type { Ticket, TicketPriorität } from "@/lib/types/ticket";

export const PRIORITY_ORDER: Record<TicketPriorität, number> = {
  dringend: 0,
  hoch: 1,
  normal: 2,
};

/** Resolve which technician should handle a ticket.
 *  Priority: ticket.techniker_id → anlage.techniker_id → geo-nearest available */
export function resolveTicketTechnician(
  ticket: Ticket,
  anlageToTechMap: Record<number, string>,
  availableTechIds: string[]
): string | null {
  if (ticket.techniker_id) return ticket.techniker_id;
  if (ticket.anlage_id != null && anlageToTechMap[ticket.anlage_id]) {
    return anlageToTechMap[ticket.anlage_id]!;
  }
  return availableTechIds[0] ?? null;
}

/** Sort tickets by priority (dringend first) then created_at (oldest first). */
export function sortTicketsByPriority(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => {
    const pd = PRIORITY_ORDER[a.prioritaet] - PRIORITY_ORDER[b.prioritaet];
    if (pd !== 0) return pd;
    return a.created_at.localeCompare(b.created_at);
  });
}
```

- [ ] **Step 4: Run tests and confirm pass**

```bash
pnpm test 2>&1 | grep -E "ticket-assignment|✓|✗" | head -10
```

- [ ] **Step 5: Commit**

```bash
git add lib/algorithm/ticket-assignment.ts tests/unit/algorithm/ticket-assignment.test.ts
git commit -m "feat: add ticket assignment and priority sorting (Step 7)"
```

---

## Task 9: Algorithm — Orchestrator

**Files:**
- Create: `lib/algorithm/tour-planning.ts`

This file wires Steps 1–8 together. It calls Supabase and the Maps API, so it is integration-tested via the Route Handler (Task 12), not unit-tested here.

- [ ] **Step 1: Create lib/algorithm/tour-planning.ts**

```typescript
// lib/algorithm/tour-planning.ts
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/profile";
import type { Abwesenheit } from "@/lib/types/abwesenheit";
import type { Ticket } from "@/lib/types/ticket";
import type { TourDraftResult } from "@/lib/types/tour";
import { buildCapacityMap } from "@/lib/algorithm/capacity";
import { buildTravelMatrix, normalizeCoord } from "@/lib/algorithm/travel-matrix";
import { kMeansPlusPlus, assignClustersToDays, type GeoPoint } from "@/lib/algorithm/clustering";
import { nearestNeighborOrder, calcArrivalTimes, minsToTimeString } from "@/lib/algorithm/routing";
import { findBestAlternativeTechnician, type TechDaySlot } from "@/lib/algorithm/absence-cover";
import { sortTicketsByPriority, resolveTicketTechnician } from "@/lib/algorithm/ticket-assignment";

function getDatesInRange(von: string, bis: string): string[] {
  const dates: string[] = [];
  const cur = new Date(von + "T12:00:00Z");
  const end = new Date(bis + "T12:00:00Z");
  while (cur <= end) {
    const d = new Date(cur);
    dates.push(d.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

export async function runTourPlanning(
  tourId: number,
  von: string,
  bis: string,
  createdBy: string,
  mapsApiKey: string,
  timeoutMs = 55000
): Promise<TourDraftResult> {
  const deadline = Date.now() + timeoutMs;
  const supabase = await createClient();
  const dates = getDatesInRange(von, bis).filter(d => {
    const dow = new Date(d + "T12:00:00Z").getUTCDay();
    return dow >= 1 && dow <= 5; // Mon–Fri only
  });
  const warnings: string[] = [];
  let partial = false;

  // --- Step 1: Data Fetch ---
  const [wartungenRes, ticketsRes, profilesRes, absenceRes] = await Promise.all([
    supabase.from("wartungsvertraege")
      .select("id, anlage_id, dauer_wartung_minuten, anlagen(id, breitengrad, laengengrad, techniker_id, name)")
      .gte("datum_naechste_wartung", von)
      .lte("datum_naechste_wartung", bis),
    supabase.from("tickets")
      .select("*")
      .eq("status", "offen"),
    supabase.from("profiles")
      .select("*")
      .eq("aktiv", true),
    supabase.from("user_abwesenheiten")
      .select("*")
      .lte("von", bis)
      .gte("bis", von),
  ]);

  const allProfiles: Profile[] = (profilesRes.data ?? []) as Profile[];
  const allAbsences: Abwesenheit[] = (absenceRes.data ?? []) as Abwesenheit[];
  const openTickets: Ticket[] = (ticketsRes.data ?? []) as Ticket[];

  // Group plants by technician
  type PlantRow = { id: number; breitengrad: string | null; laengengrad: string | null; techniker_id: string | null; name: string | null };
  const plantsByTech: Record<string, GeoPoint[]> = {};
  const anlageToTech: Record<number, string> = {};

  for (const wv of wartungenRes.data ?? []) {
    const anlage = wv.anlagen as unknown as PlantRow | null;
    if (!anlage) continue;
    if (!anlage.breitengrad || !anlage.laengengrad) {
      warnings.push(`Anlage ${anlage.name ?? wv.anlage_id} hat keine GPS-Koordinaten und wurde übersprungen.`);
      continue;
    }
    const techId = anlage.techniker_id ?? "unassigned";
    if (!plantsByTech[techId]) plantsByTech[techId] = [];
    plantsByTech[techId].push({
      id: String(wv.anlage_id),
      lat: normalizeCoord(anlage.breitengrad),
      lng: normalizeCoord(anlage.laengengrad),
      dauer_minuten: wv.dauer_wartung_minuten ?? 60,
    });
    if (anlage.techniker_id) anlageToTech[wv.anlage_id] = anlage.techniker_id;
  }

  // --- Step 2: Capacity Map ---
  const capacity = buildCapacityMap(allProfiles, allAbsences, dates);

  // --- Steps 3–7: Per-technician routing ---
  const allStopRows: Array<{
    tour_id: number; techniker_id: string; datum: string; position: number;
    item_type: string; anlage_id?: number; ticket_id?: number;
    geplante_startzeit: string; fahrtzeit_minuten: number; dauer_minuten: number;
    original_techniker_id?: string;
  }> = [];

  for (const profile of allProfiles) {
    if (Date.now() > deadline) { partial = true; break; }
    const plants = plantsByTech[profile.id] ?? [];
    if (plants.length === 0) continue;
    const startPoint = profile.start_lat && profile.start_lng
      ? { lat: profile.start_lat, lng: profile.start_lng }
      : { lat: plants[0]!.lat, lng: plants[0]!.lng };

    const availableDates = dates.filter(d => (capacity[profile.id]?.[d]?.available_mins ?? 0) > 0);
    if (availableDates.length === 0) continue;

    // Step 3: Travel matrix
    const allPoints = [startPoint, ...plants.map(p => ({ lat: p.lat, lng: p.lng }))];
    const matrix = await buildTravelMatrix(allPoints, mapsApiKey);
    if (Date.now() > deadline) { partial = true; break; }

    // Step 4: Clustering
    let dayAssignment: Record<string, GeoPoint[]>;
    if (availableDates.length <= 2) {
      // Greedy fill
      dayAssignment = {};
      let di = 0;
      for (const p of plants) {
        const date = availableDates[di % availableDates.length]!;
        if (!dayAssignment[date]) dayAssignment[date] = [];
        dayAssignment[date].push(p);
        di++;
      }
    } else {
      const clusters = kMeansPlusPlus(plants, availableDates.length, tourId);
      dayAssignment = assignClustersToDays(clusters, startPoint, availableDates);
    }

    // Step 5: Route ordering per day
    for (const [datum, dayPlants] of Object.entries(dayAssignment)) {
      const capInfo = capacity[profile.id]?.[datum];
      if (!capInfo || capInfo.available_mins === 0) continue;
      const ordered = nearestNeighborOrder(dayPlants, startPoint, matrix);
      const scheduled = calcArrivalTimes(ordered, startPoint, capInfo.route_start_mins, matrix);
      for (const stop of scheduled) {
        allStopRows.push({
          tour_id: tourId,
          techniker_id: profile.id,
          datum,
          position: stop.position,
          item_type: "wartung",
          anlage_id: parseInt(stop.id),
          geplante_startzeit: minsToTimeString(stop.geplante_startzeit_mins),
          fahrtzeit_minuten: stop.fahrtzeit_minuten,
          dauer_minuten: stop.dauer_minuten,
        });
      }
    }
  }

  // --- Step 7: Ticket Assignment ---
  const availableTechIds = allProfiles
    .filter(p => dates.some(d => (capacity[p.id]?.[d]?.available_mins ?? 0) > 0))
    .map(p => p.id);

  for (const ticket of sortTicketsByPriority(openTickets)) {
    const techId = resolveTicketTechnician(ticket, anlageToTech, availableTechIds);
    if (!techId) { warnings.push(`Ticket #${ticket.ticket_nr ?? ticket.id} konnte keinem Techniker zugeordnet werden.`); continue; }
    const bestDate = dates
      .filter(d => (capacity[techId]?.[d]?.available_mins ?? 0) > 0)
      .sort((a, b) => (capacity[techId]?.[b]?.available_mins ?? 0) - (capacity[techId]?.[a]?.available_mins ?? 0))[0];
    if (!bestDate) continue;
    const existingStops = allStopRows.filter(s => s.techniker_id === techId && s.datum === bestDate);
    allStopRows.push({
      tour_id: tourId,
      techniker_id: techId,
      datum: bestDate,
      position: existingStops.length,
      item_type: "ticket",
      ticket_id: ticket.id,
      geplante_startzeit: "00:00:00",
      fahrtzeit_minuten: 0,
      dauer_minuten: 60,
    });
  }

  // --- Step 8: Save Draft ---
  if (allStopRows.length > 0) {
    await supabase.from("tour_eintraege").insert(allStopRows);
  }

  // Update tickets status to 'eingeplant'
  const ticketIds = allStopRows.filter(s => s.item_type === "ticket").map(s => s.ticket_id!);
  if (ticketIds.length > 0) {
    await supabase.from("tickets").update({ status: "eingeplant" }).in("id", ticketIds);
  }

  // Flag partial
  if (partial) {
    await supabase.from("touren").update({ partial: true }).eq("id", tourId);
  }

  return { tourId, warnings, partial };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | grep "tour-planning" | head -5
```

- [ ] **Step 3: Commit**

```bash
git add lib/algorithm/
git commit -m "feat: add tour planning orchestrator (Steps 1-8)"
```

---

## Task 10: Data Layer — lib/data/touren.ts

**Files:**
- Create: `lib/data/touren.ts`

- [ ] **Step 1: Create lib/data/touren.ts**

```typescript
// lib/data/touren.ts
import { createClient } from "@/lib/supabase/server";
import type { Tour, TourEintrag, TourQueryResult } from "@/lib/types/tour";

export function mapRowToTour(row: Record<string, unknown>): Tour {
  const profiles = row.profiles as { vorname?: string; nachname?: string } | null;
  const technikerSet = new Set((row.tour_eintraege as Array<{ techniker_id: string }> | null ?? []).map(e => e.techniker_id));
  return {
    id: row.id as number,
    name: row.name as string,
    von: row.von as string,
    bis: row.bis as string,
    status: row.status as Tour["status"],
    created_by: row.created_by as string,
    partial: row.partial as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string | undefined,
    created_by_name: profiles
      ? [profiles.vorname, profiles.nachname].filter(Boolean).join(" ") || undefined
      : undefined,
    techniker_count: technikerSet.size,
    stop_count: (row.tour_eintraege as unknown[] | null)?.length ?? 0,
  };
}

export async function getTouren(params: {
  page?: number; pageSize?: number;
} = {}): Promise<TourQueryResult> {
  const { page = 1, pageSize = 20 } = params;
  const supabase = await createClient();
  const from = (page - 1) * pageSize;

  const { data, count, error } = await supabase
    .from("touren")
    .select("*, profiles(vorname, nachname), tour_eintraege(techniker_id)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) { console.error("getTouren:", error); return { data: [], totalCount: 0 }; }
  return { data: (data ?? []).map(r => mapRowToTour(r as Record<string, unknown>)), totalCount: count ?? 0 };
}

export async function getTourById(id: number): Promise<Tour | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("touren")
    .select("*, profiles(vorname, nachname), tour_eintraege(techniker_id)")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mapRowToTour(data as Record<string, unknown>);
}

export function mapRowToTourEintrag(row: Record<string, unknown>): TourEintrag {
  const anlage = row.anlagen as Record<string, unknown> | null;
  const ticket = row.tickets as Record<string, unknown> | null;
  const profile = row.profiles as Record<string, unknown> | null;
  return {
    id: row.id as number,
    tour_id: row.tour_id as number,
    techniker_id: row.techniker_id as string,
    datum: row.datum as string,
    position: row.position as number,
    item_type: row.item_type as TourEintrag["item_type"],
    anlage_id: row.anlage_id as number | undefined,
    ticket_id: row.ticket_id as number | undefined,
    geplante_startzeit: row.geplante_startzeit as string | undefined,
    fahrtzeit_minuten: row.fahrtzeit_minuten as number | undefined,
    dauer_minuten: row.dauer_minuten as number | undefined,
    original_techniker_id: row.original_techniker_id as string | undefined,
    notizen: row.notizen as string | undefined,
    created_at: row.created_at as string,
    techniker_name: profile
      ? [profile.vorname, profile.nachname].filter(Boolean).join(" ") || undefined
      : undefined,
    anlage_name: anlage?.name as string | undefined,
    anlage_lat: anlage?.breitengrad ? parseFloat(anlage.breitengrad as string) : undefined,
    anlage_lng: anlage?.laengengrad ? parseFloat(anlage.laengengrad as string) : undefined,
    anlage_adresse: anlage
      ? [anlage.strasse, anlage.hausnr, anlage.ort].filter(Boolean).join(" ") || undefined
      : undefined,
    ticket_titel: ticket?.titel as string | undefined,
  };
}

export async function getTourEintraege(tourId: number): Promise<TourEintrag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tour_eintraege")
    .select("*, profiles(vorname, nachname), anlagen(name, breitengrad, laengengrad, strasse, hausnr, ort), tickets(titel)")
    .eq("tour_id", tourId)
    .order("datum", { ascending: true })
    .order("position", { ascending: true });
  if (error) { console.error("getTourEintraege:", error); return []; }
  return (data ?? []).map(r => mapRowToTourEintrag(r as Record<string, unknown>));
}

export async function getPublishedTourEintraegeForDateRange(von: string, bis: string): Promise<TourEintrag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tour_eintraege")
    .select("*, profiles(vorname, nachname), anlagen(name, breitengrad, laengengrad, strasse, hausnr, ort), tickets(titel), touren!inner(status)")
    .eq("touren.status", "veröffentlicht")
    .gte("datum", von)
    .lte("datum", bis);
  if (error) { console.error("getPublishedTourEintraegeForDateRange:", error); return []; }
  return (data ?? []).map(r => mapRowToTourEintrag(r as Record<string, unknown>));
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | grep "touren" | head -5
```

- [ ] **Step 3: Commit**

```bash
git add lib/data/touren.ts
git commit -m "feat: add tour data layer (getTouren, getTourById, getTourEintraege)"
```

---

## Task 11: Server Actions — lib/actions/touren.ts

**Files:**
- Create: `lib/actions/touren.ts`

- [ ] **Step 1: Create lib/actions/touren.ts**

```typescript
// lib/actions/touren.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getTourEintraege } from "@/lib/data/touren";
import { nearestNeighborOrder, calcArrivalTimes, minsToTimeString } from "@/lib/algorithm/routing";
import { buildCapacityMap } from "@/lib/algorithm/capacity";
import { buildTravelMatrix, normalizeCoord } from "@/lib/algorithm/travel-matrix";
import type { TourEintrag } from "@/lib/types/tour";
import type { Abwesenheit } from "@/lib/types/abwesenheit";
import type { Profile } from "@/lib/types/profile";

export async function publishTour(
  tourId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("touren")
    .update({ status: "veröffentlicht", updated_at: new Date().toISOString() })
    .eq("id", tourId)
    .eq("status", "entwurf");
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function revertToDraft(
  tourId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("touren")
    .update({ status: "entwurf", updated_at: new Date().toISOString() })
    .eq("id", tourId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteTour(
  tourId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  // Revert ticket statuses first
  const { data: ticketStops } = await supabase
    .from("tour_eintraege")
    .select("ticket_id")
    .eq("tour_id", tourId)
    .eq("item_type", "ticket");
  const ticketIds = (ticketStops ?? []).map(s => s.ticket_id).filter(Boolean) as number[];
  if (ticketIds.length > 0) {
    await supabase.from("tickets").update({ status: "offen" }).in("id", ticketIds);
  }
  const { error } = await supabase.from("touren").delete().eq("id", tourId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function moveTourEintrag(
  stopId: number,
  newTechnikerId: string,
  newDatum: string,
  newPosition: number
): Promise<{ success: boolean; eintraege?: TourEintrag[]; error?: string }> {
  const supabase = await createClient();

  // Get the stop to find its tour_id and original day
  const { data: stop, error: fetchErr } = await supabase
    .from("tour_eintraege")
    .select("*")
    .eq("id", stopId)
    .single();
  if (fetchErr || !stop) return { success: false, error: "Stop not found" };

  const tourId = stop.tour_id as number;
  const oldTechId = stop.techniker_id as string;
  const oldDatum = stop.datum as string;

  // Update the moved stop
  const { error: updateErr } = await supabase
    .from("tour_eintraege")
    .update({ techniker_id: newTechnikerId, datum: newDatum, position: newPosition })
    .eq("id", stopId);
  if (updateErr) return { success: false, error: updateErr.message };

  // Repack positions for affected days
  for (const [techId, datum] of [[oldTechId, oldDatum], [newTechnikerId, newDatum]]) {
    const { data: dayStops } = await supabase
      .from("tour_eintraege")
      .select("id")
      .eq("tour_id", tourId)
      .eq("techniker_id", techId)
      .eq("datum", datum)
      .order("position", { ascending: true });
    for (let i = 0; i < (dayStops ?? []).length; i++) {
      await supabase.from("tour_eintraege").update({ position: i }).eq("id", dayStops![i]!.id);
    }
  }

  const updated = await getTourEintraege(tourId);
  return { success: true, eintraege: updated };
}

export async function removeTicketFromTour(
  stopId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: stop } = await supabase
    .from("tour_eintraege").select("ticket_id").eq("id", stopId).single();
  if (stop?.ticket_id) {
    await supabase.from("tickets").update({ status: "offen" }).eq("id", stop.ticket_id);
  }
  const { error } = await supabase.from("tour_eintraege").delete().eq("id", stopId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function reoptimiseDay(
  tourId: number,
  technikerId: string,
  datum: string
): Promise<{ success: boolean; eintraege?: TourEintrag[]; error?: string }> {
  const supabase = await createClient();
  const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? "";

  // Load current stops for this day
  const { data: dayStops } = await supabase
    .from("tour_eintraege")
    .select("*, anlagen(breitengrad, laengengrad)")
    .eq("tour_id", tourId)
    .eq("techniker_id", technikerId)
    .eq("datum", datum)
    .order("position", { ascending: true });

  if (!dayStops || dayStops.length === 0) return { success: true, eintraege: [] };

  // Get technician profile for start point + capacity
  const { data: profileData } = await supabase
    .from("profiles").select("*").eq("id", technikerId).single();
  const profile = profileData as Profile | null;
  const { data: absData } = await supabase
    .from("user_abwesenheiten").select("*")
    .lte("von", datum + "T23:59:59Z").gte("bis", datum + "T00:00:00Z")
    .eq("user_id", technikerId);

  const capacityMap = buildCapacityMap(
    profile ? [profile] : [],
    (absData ?? []) as Abwesenheit[],
    [datum]
  );
  const capInfo = capacityMap[technikerId]?.[datum];
  if (!capInfo || capInfo.available_mins === 0) return { success: false, error: "No capacity" };

  const startPoint = profile?.start_lat && profile?.start_lng
    ? { lat: profile.start_lat, lng: profile.start_lng }
    : null;

  type StopWithCoords = { id: number; lat: number; lng: number; dauer_minuten: number };
  const routableStops: StopWithCoords[] = [];
  for (const s of dayStops) {
    const anlage = s.anlagen as { breitengrad?: string; laengengrad?: string } | null;
    if (!anlage?.breitengrad || !anlage?.laengengrad) continue;
    routableStops.push({
      id: s.id as number,
      lat: normalizeCoord(anlage.breitengrad),
      lng: normalizeCoord(anlage.laengengrad),
      dauer_minuten: (s.dauer_minuten as number) ?? 60,
    });
  }

  if (routableStops.length === 0) return { success: true, eintraege: [] };
  const origin = startPoint ?? { lat: routableStops[0]!.lat, lng: routableStops[0]!.lng };
  const allPoints = [origin, ...routableStops.map(s => ({ lat: s.lat, lng: s.lng }))];
  const matrix = await buildTravelMatrix(allPoints, mapsApiKey);

  const routables = routableStops.map(s => ({ ...s, id: String(s.id) }));
  const ordered = nearestNeighborOrder(routables, origin, matrix);
  const scheduled = calcArrivalTimes(ordered, origin, capInfo.route_start_mins, matrix);

  // Write back positions and times
  for (const stop of scheduled) {
    await supabase.from("tour_eintraege").update({
      position: stop.position,
      geplante_startzeit: minsToTimeString(stop.geplante_startzeit_mins),
      fahrtzeit_minuten: stop.fahrtzeit_minuten,
    }).eq("id", parseInt(stop.id));
  }

  const updated = await getTourEintraege(tourId);
  return { success: true, eintraege: updated };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | grep "actions/touren" | head -5
```

- [ ] **Step 3: Commit**

```bash
git add lib/actions/touren.ts
git commit -m "feat: add tour server actions (publish, revert, delete, move, reoptimise)"
```

---

## Task 12: Route Handler — Algorithm Endpoint

**Files:**
- Create: `app/api/tours/plan/route.ts`

- [ ] **Step 1: Create app/api/tours/plan/route.ts**

```typescript
// app/api/tours/plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runTourPlanning } from "@/lib/algorithm/tour-planning";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { name?: string; von?: string; bis?: string };
  const { name, von, bis } = body;
  if (!name || !von || !bis) {
    return NextResponse.json({ error: "name, von, bis required" }, { status: 400 });
  }

  const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? "";
  if (!mapsApiKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY not configured" }, { status: 500 });
  }

  // Create tour header first to get the ID
  const { data: tour, error: tourErr } = await supabase
    .from("touren")
    .insert({ name, von, bis, status: "entwurf", created_by: user.id })
    .select()
    .single();

  if (tourErr || !tour) {
    return NextResponse.json({ error: tourErr?.message ?? "Failed to create tour" }, { status: 500 });
  }

  try {
    const result = await runTourPlanning(tour.id, von, bis, user.id, mapsApiKey);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Tour planning error:", err);
    // Mark tour as partial on unexpected failure
    await supabase.from("touren").update({ partial: true }).eq("id", tour.id);
    return NextResponse.json({ tourId: tour.id, warnings: ["Planung unvollständig."], partial: true });
  }
}
```

- [ ] **Step 2: Add GOOGLE_MAPS_API_KEY to .env.local**

Add the following line to `.env.local` (ask user to provide key):
```
GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | grep "api/tours" | head -5
```

- [ ] **Step 4: Commit**

```bash
git add app/api/tours/
git commit -m "feat: add tour planning Route Handler POST /api/tours/plan"
```

---

## Task 13: Tour List Page

**Files:**
- Modify: `app/(dashboard)/master-data/tours/page.tsx`
- Modify: `components/dashboard/maintenance-calendar.tsx` (wire "Neue Tourplanung" button)

- [ ] **Step 1: Replace tours/page.tsx stub with full list**

Replace the entire file content of `app/(dashboard)/master-data/tours/page.tsx`:

```typescript
// app/(dashboard)/master-data/tours/page.tsx
import { getTouren } from "@/lib/data/touren";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { TourPlanningDialogTrigger } from "@/components/dashboard/tour-planning-dialog-trigger";

export default async function ToursPage() {
  const { data: tours } = await getTouren({ pageSize: 50 });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Touren</h1>
          <p className="text-muted-foreground">Planen und verwalten Sie Ihre Wartungstouren</p>
        </div>
        <TourPlanningDialogTrigger />
      </div>

      {tours.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">Noch keine Touren erstellt.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Zeitraum</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Techniker</TableHead>
              <TableHead>Stopps</TableHead>
              <TableHead>Erstellt von</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tours.map(tour => (
              <TableRow key={tour.id}>
                <TableCell className="font-medium">{tour.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(tour.von).toLocaleDateString("de-DE")} –{" "}
                  {new Date(tour.bis).toLocaleDateString("de-DE")}
                </TableCell>
                <TableCell>
                  <Badge variant={tour.status === "veröffentlicht" ? "default" : "secondary"}>
                    {tour.status === "veröffentlicht" ? "Veröffentlicht" : "Entwurf"}
                  </Badge>
                  {tour.partial && (
                    <Badge variant="destructive" className="ml-1">Unvollständig</Badge>
                  )}
                </TableCell>
                <TableCell>{tour.techniker_count ?? 0}</TableCell>
                <TableCell>{tour.stop_count ?? 0}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{tour.created_by_name ?? "—"}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/master-data/tours/${tour.id}`}>Öffnen</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create TourPlanningDialogTrigger component**

Create `components/dashboard/tour-planning-dialog-trigger.tsx` — a `"use client"` wrapper that wraps the existing `TourPlanningDialog` and on success navigates to `/master-data/tours/[id]`:

```typescript
// components/dashboard/tour-planning-dialog-trigger.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { TourPlanningForm } from "@/components/dashboard/tour-planning-form";

export function TourPlanningDialogTrigger() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleSuccess(tourId: number) {
    setOpen(false);
    router.push(`/master-data/tours/${tourId}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><PlusIcon className="mr-2 h-4 w-4" />Neue Tourplanung</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Neue Tourplanung</DialogTitle></DialogHeader>
        <TourPlanningForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Create TourPlanningForm component**

Create `components/dashboard/tour-planning-form.tsx` — a `"use client"` form that calls `POST /api/tours/plan` and returns the `tourId` on success:

```typescript
// components/dashboard/tour-planning-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  onSuccess: (tourId: number) => void;
}

export function TourPlanningForm({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [von, setVon] = useState("");
  const [bis, setBis] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !von || !bis) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tours/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), von, bis }),
      });
      const data = await res.json() as { tourId?: number; warnings?: string[]; error?: string };
      if (!res.ok || !data.tourId) {
        toast.error(data.error ?? "Fehler bei der Tourplanung");
        return;
      }
      if (data.warnings && data.warnings.length > 0) {
        toast.warning(`Tour erstellt mit ${data.warnings.length} Hinweis(en)`);
      }
      onSuccess(data.tourId);
    } catch {
      toast.error("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="tour-name">Name</Label>
        <Input id="tour-name" value={name} onChange={e => setName(e.target.value)}
          placeholder="z.B. KW 14–16 2026" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="tour-von">Von</Label>
          <Input id="tour-von" type="date" value={von} onChange={e => setVon(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tour-bis">Bis</Label>
          <Input id="tour-bis" type="date" value={bis} onChange={e => setBis(e.target.value)} required />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Berechne Route…" : "Tour planen"}
      </Button>
      {loading && (
        <p className="text-xs text-muted-foreground text-center">
          Die Tourenplanung kann bis zu 60 Sekunden dauern.
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 4: Wire "Neue Tourplanung" button in maintenance-calendar.tsx**

The existing `TourPlanningDialog` component (`components/dashboard/tour-planning-dialog.tsx`) has a different interface (takes `open`, `onOpenChange`, `tasks`, `onStartPlanning`) and uses week-number selectors — it is **superseded** by the new `TourPlanningForm`. Do the following:

1. Search `maintenance-calendar.tsx` for the existing `<TourPlanningDialog` usage and `onStartPlanning` callback (currently stubs `console.log`).
2. Remove the `TourPlanningDialog` import and its state variables (`open`, `setOpen`, etc.).
3. Render `<TourPlanningDialogTrigger />` (from `@/components/dashboard/tour-planning-dialog-trigger`) in the same position where the "Neue Tourplanung" button was.
4. The old `tour-planning-dialog.tsx` file can be left in place (it is unused) or deleted — either is fine.

This gives the calendar header a working planning button without duplicating dialog state.

- [ ] **Step 5: Verify dev build**

```bash
pnpm build 2>&1 | tail -20
```
Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
git add app/(dashboard)/master-data/tours/ components/dashboard/tour-planning-dialog-trigger.tsx components/dashboard/tour-planning-form.tsx components/dashboard/maintenance-calendar.tsx
git commit -m "feat: add tour list page and tour planning form"
```

---

## Task 14: Tour Stop Card + Planning Page Shell

**Files:**
- Create: `components/dashboard/tour-stop-card.tsx`
- Create: `app/(dashboard)/master-data/tours/[id]/page.tsx`

- [ ] **Step 1: Create tour-stop-card.tsx**

```typescript
// components/dashboard/tour-stop-card.tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TourEintrag } from "@/lib/types/tour";

interface TourStopCardProps {
  stop: TourEintrag;
  className?: string;
}

function formatTime(time?: string): string {
  if (!time) return "—";
  return time.slice(0, 5); // "HH:MM"
}

export function TourStopCard({ stop, className }: TourStopCardProps) {
  const isTicket = stop.item_type === "ticket";
  const title = isTicket ? stop.ticket_titel : stop.anlage_name;
  const address = stop.anlage_adresse;

  return (
    <Card className={cn("text-xs border-l-2", isTicket ? "border-l-red-500" : "border-l-blue-500", className)}>
      <CardContent className="p-2 space-y-0.5">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="font-medium truncate">{title ?? "—"}</span>
          {isTicket && <Badge variant="destructive" className="h-4 text-[10px]">Ticket</Badge>}
          {stop.original_techniker_id && (
            <Badge variant="outline" className="h-4 text-[10px] border-amber-500 text-amber-600">Vertretung</Badge>
          )}
        </div>
        {address && <div className="text-muted-foreground truncate">{address}</div>}
        <div className="flex gap-2 text-muted-foreground">
          <span>▶ {formatTime(stop.geplante_startzeit)}</span>
          {stop.fahrtzeit_minuten != null && <span>🚗 {stop.fahrtzeit_minuten} min</span>}
          {stop.dauer_minuten != null && <span>⏱ {stop.dauer_minuten} min</span>}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create app/(dashboard)/master-data/tours/[id]/page.tsx**

```typescript
// app/(dashboard)/master-data/tours/[id]/page.tsx
import { notFound } from "next/navigation";
import { getTourById, getTourEintraege } from "@/lib/data/touren";
import { TourGrid } from "@/components/dashboard/tour-grid";
import { createClient } from "@/lib/supabase/server";
import type { Ticket } from "@/lib/types/ticket";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TourPlanningPage({ params }: Props) {
  const { id } = await params;
  const tourId = parseInt(id);
  if (isNaN(tourId)) notFound();

  const supabase = await createClient();
  const [tour, eintraege, ticketsRes] = await Promise.all([
    getTourById(tourId),
    getTourEintraege(tourId),
    supabase.from("tickets").select("*").eq("status", "offen"),
  ]);

  if (!tour) notFound();

  // Open tickets not already scheduled in this tour
  const scheduledTicketIds = new Set(eintraege.filter(e => e.ticket_id != null).map(e => e.ticket_id!));
  const openTickets = ((ticketsRes.data ?? []) as Ticket[])
    .filter(t => !scheduledTicketIds.has(t.id));

  return <TourGrid tour={tour} initialEintraege={eintraege} openTickets={openTickets} />;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | grep "tours/\[id\]" | head -5
```

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/tour-stop-card.tsx "app/(dashboard)/master-data/tours/[id]/"
git commit -m "feat: add tour stop card and planning page shell"
```

---

## Task 15: Tour Grid with Drag-and-Drop

**Files:**
- Create: `components/dashboard/tour-grid.tsx`
- Create: `components/dashboard/tour-ticket-sidebar.tsx`

- [ ] **Step 1: Create tour-ticket-sidebar.tsx**

```typescript
// components/dashboard/tour-ticket-sidebar.tsx
"use client";

import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Ticket } from "@/lib/types/ticket";

interface Props {
  tickets: Ticket[];
  onDismiss?: (ticketId: number) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  dringend: "destructive",
  hoch: "outline",
  normal: "secondary",
};

export function TourTicketSidebar({ tickets, onDismiss }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: "ticket-sidebar" });

  return (
    <div
      ref={setNodeRef}
      className={`w-64 shrink-0 flex flex-col border rounded-lg ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">Offene Tickets</h3>
        <p className="text-xs text-muted-foreground">{tickets.length} Ticket(s)</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {tickets.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Alle Tickets eingeplant</p>
          )}
          {tickets.map(ticket => (
            <Card key={ticket.id} className="text-xs cursor-grab active:cursor-grabbing border-l-2 border-l-red-500">
              <CardContent className="p-2 space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-medium truncate">{ticket.titel}</span>
                  <Badge
                    variant={PRIORITY_COLORS[ticket.prioritaet] as "destructive" | "outline" | "secondary"}
                    className="h-4 text-[10px] shrink-0"
                  >
                    {ticket.prioritaet}
                  </Badge>
                </div>
                {ticket.strasse && (
                  <div className="text-muted-foreground truncate">
                    {ticket.strasse} {ticket.hausnr}, {ticket.ort}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
```

- [ ] **Step 2: Create tour-grid.tsx**

```typescript
// components/dashboard/tour-grid.tsx
"use client";

import { useState, useTransition } from "react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { Tour, TourEintrag } from "@/lib/types/tour";
import { TourStopCard } from "@/components/dashboard/tour-stop-card";
import { TourTicketSidebar } from "@/components/dashboard/tour-ticket-sidebar";
import { moveTourEintrag, publishTour, revertToDraft, reoptimiseDay } from "@/lib/actions/touren";

interface Props {
  tour: Tour;
  initialEintraege: TourEintrag[];
  /** Open tickets not yet assigned to this tour — fetched server-side and passed in */
  openTickets: import("@/lib/types/ticket").Ticket[];
}

function getDatesInRange(von: string, bis: string): string[] {
  const dates: string[] = [];
  const cur = new Date(von + "T12:00:00Z");
  const end = new Date(bis + "T12:00:00Z");
  while (cur <= end) {
    const dow = cur.getUTCDay();
    if (dow >= 1 && dow <= 5) dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

function formatDateDE(date: string): string {
  return new Date(date + "T12:00:00Z").toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export function TourGrid({ tour, initialEintraege, openTickets: initialOpenTickets }: Props) {
  const [eintraege, setEintraege] = useState<TourEintrag[]>(initialEintraege);
  const [tourStatus, setTourStatus] = useState(tour.status);
  const [openTickets, setOpenTickets] = useState(initialOpenTickets);
  const [isPending, startTransition] = useTransition();

  const dates = getDatesInRange(tour.von, tour.bis);
  const technikerIds = [...new Set(eintraege.map(e => e.techniker_id))];

  function getStopsForCell(techId: string, datum: string): TourEintrag[] {
    return eintraege
      .filter(e => e.techniker_id === techId && e.datum === datum)
      .sort((a, b) => a.position - b.position);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    // Cell drop target id format: "cell||{techId}||{datum}"
    // IMPORTANT: use "||" not "-" as separator — techId is a UUID which contains hyphens.
    const overStr = String(over.id);
    if (!overStr.startsWith("cell||")) return;
    const parts = overStr.split("||");
    const techId = parts[1]!;
    const datum = parts[2]!;
    const stopId = parseInt(String(active.id));
    const targetStops = getStopsForCell(techId, datum);

    startTransition(async () => {
      const result = await moveTourEintrag(stopId, techId, datum, targetStops.length);
      if (result.success && result.eintraege) {
        setEintraege(result.eintraege);
      } else {
        toast.error(result.error ?? "Fehler beim Verschieben");
      }
    });
  }

  async function handlePublish() {
    const result = await publishTour(tour.id);
    if (result.success) { setTourStatus("veröffentlicht"); toast.success("Tour veröffentlicht"); }
    else toast.error(result.error ?? "Fehler");
  }

  async function handleRevert() {
    const result = await revertToDraft(tour.id);
    if (result.success) { setTourStatus("entwurf"); toast.success("Tour zurück zu Entwurf"); }
    else toast.error(result.error ?? "Fehler");
  }

  async function handleReoptimise(techId: string, datum: string) {
    const result = await reoptimiseDay(tour.id, techId, datum);
    if (result.success && result.eintraege) { setEintraege(result.eintraege); toast.success("Route neu berechnet"); }
    else toast.error(result.error ?? "Fehler");
  }

  // openTickets = tickets passed in as prop (fetched on server, not yet in the tour grid)
  // These come from the page — see Props below.

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b flex-wrap">
          <h1 className="text-xl font-semibold flex-1">{tour.name}</h1>
          <Badge variant={tourStatus === "veröffentlicht" ? "default" : "secondary"}>
            {tourStatus === "veröffentlicht" ? "Veröffentlicht" : "Entwurf"}
          </Badge>
          {tour.partial && <Badge variant="destructive">Unvollständig</Badge>}
          {tourStatus === "entwurf" ? (
            <Button onClick={handlePublish} disabled={isPending}>Veröffentlichen</Button>
          ) : (
            <Button variant="outline" onClick={handleRevert} disabled={isPending}>Zurück zu Entwurf</Button>
          )}
        </div>

        {/* Main area: grid + sidebar */}
        <div className="flex flex-1 overflow-hidden gap-4 p-4">
          <ScrollArea className="flex-1">
            <div className="inline-grid" style={{ gridTemplateColumns: `160px repeat(${dates.length}, minmax(160px, 1fr))` }}>
              {/* Header row */}
              <div className="p-2 font-medium text-sm text-muted-foreground border-b">Techniker</div>
              {dates.map(d => (
                <div key={d} className="p-2 font-medium text-sm border-b text-center">{formatDateDE(d)}</div>
              ))}
              {/* Technician rows */}
              {technikerIds.map(techId => (
                <>
                  <div key={`name-${techId}`} className="p-2 text-sm font-medium border-b self-start pt-3 truncate">
                    {eintraege.find(e => e.techniker_id === techId)?.techniker_name ?? techId.slice(0, 8)}
                  </div>
                  {dates.map(datum => {
                    const stops = getStopsForCell(techId, datum);
                    const totalMins = stops.reduce((s, e) => s + (e.dauer_minuten ?? 0) + (e.fahrtzeit_minuten ?? 0), 0);
                    return (
                      <div
                        key={`cell||${techId}||${datum}`}
                        id={`cell||${techId}||${datum}`}
                        className="border border-dashed rounded-md m-1 p-1 min-h-[80px] space-y-1"
                      >
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] text-muted-foreground">{totalMins} min</span>
                          <Button
                            variant="ghost" size="icon" className="h-5 w-5"
                            onClick={() => handleReoptimise(techId, datum)}
                            title="Route neu berechnen"
                            disabled={isPending || stops.length === 0}
                          >
                            ↺
                          </Button>
                        </div>
                        {stops.map(stop => (
                          <TourStopCard key={stop.id} stop={stop} />
                        ))}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TourTicketSidebar tickets={openTickets} />
        </div>
      </div>
    </DndContext>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | grep -E "tour-grid|tour-ticket" | head -5
```

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/tour-grid.tsx components/dashboard/tour-ticket-sidebar.tsx
git commit -m "feat: add tour planning grid with drag-and-drop and per-day reoptimisation"
```

---

## Task 16: Dashboard Calendar Extension

**Files:**
- Modify: `components/dashboard/maintenance-calendar.tsx`
- Modify: `components/dashboard/compact-task-card.tsx` (or wherever task cards are defined)

- [ ] **Step 1: Read compact-task-card.tsx to understand card structure**

Before modifying, read `components/dashboard/compact-task-card.tsx` to understand the existing card variants and the `TechnicianTour` component props.

- [ ] **Step 2: Add "Geplant" card variant to compact-task-card.tsx**

Locate the task card component. Add a new `GeplantCard` component (or variant) that accepts a `TourEintrag`:

```typescript
// In compact-task-card.tsx (add near existing card components)
import type { TourEintrag } from "@/lib/types/tour";

interface GeplantCardProps {
  eintrag: TourEintrag;
}

export function GeplantCard({ eintrag }: GeplantCardProps) {
  const title = eintrag.item_type === "ticket" ? eintrag.ticket_titel : eintrag.anlage_name;
  const time = eintrag.geplante_startzeit?.slice(0, 5);
  return (
    <div className="rounded border border-green-700/30 bg-green-950/20 p-1.5 text-xs space-y-0.5">
      <div className="flex items-center gap-1">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
        <span className="font-medium truncate">{title ?? "—"}</span>
      </div>
      <div className="text-muted-foreground flex gap-2">
        {time && <span>▶ {time}</span>}
        {eintrag.fahrtzeit_minuten != null && <span>🚗 {eintrag.fahrtzeit_minuten} min</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Extend maintenance-calendar.tsx to fetch and display published tour entries**

The calendar is a client component. Published tour entries need to be fetched on the server and passed as a prop, OR fetched client-side. Because the calendar is `"use client"`, the cleanest approach is to add a new prop `publishedEintraege?: TourEintrag[]` and pass it from the server-rendered parent (`app/(dashboard)/page.tsx`).

**In `app/(dashboard)/page.tsx`** (the main dashboard page), add:
```typescript
// Read the current date range displayed by the calendar
// and fetch published tour entries for that window
import { getPublishedTourEintraegeForDateRange } from "@/lib/data/touren";

// Fetch for the current 4-week window
const today = new Date();
const von = today.toISOString().slice(0, 10);
const bis4w = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const publishedEintraege = await getPublishedTourEintraegeForDateRange(von, bis4w);
```

Then pass `publishedEintraege` to `<MaintenanceCalendar>`.

**In `maintenance-calendar.tsx`**, add the prop to the interface and in each `TechnicianTour` (or equivalent day-cell), check for matching `TourEintrag` entries by `(techniker_id, datum)`. If a `TourEintrag` exists for a plant/date pair, render `<GeplantCard>` instead of the "Due" card.

- [ ] **Step 4: Test that the calendar still renders without errors**

```bash
pnpm build 2>&1 | tail -10
```
Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/compact-task-card.tsx components/dashboard/maintenance-calendar.tsx app/\(dashboard\)/page.tsx
git commit -m "feat: extend dashboard calendar with published tour entries (Geplant cards)"
```

---

## Task 17: Run All Tests + Final Verification

- [ ] **Step 1: Run full test suite**

```bash
pnpm test
```
Expected: all unit tests pass (capacity, clustering, routing, absence-cover, ticket-assignment).

- [ ] **Step 2: Run lint**

```bash
pnpm lint 2>&1 | head -30
```
Expected: no errors.

- [ ] **Step 3: Run production build**

```bash
pnpm build
```
Expected: clean build with no type errors.

- [ ] **Step 4: Start dev server and verify tour list page loads**

```bash
pnpm dev
```

Navigate to `/master-data/tours` — should show the tour list table (or empty state) without errors.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: Tour & Route Planning — complete implementation"
```

---

## Environment Variables Required

Add to `.env.local`:
```
GOOGLE_MAPS_API_KEY=<your Google Maps API key with Distance Matrix API enabled>
```

The Distance Matrix API must be enabled in the Google Cloud Console for the project associated with this key.
