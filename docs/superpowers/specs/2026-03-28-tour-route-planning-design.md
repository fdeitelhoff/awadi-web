# Tour & Route Planning — Design Spec

**Date:** 2026-03-28
**Status:** Approved
**Project:** AWADI — Maintenance Software for Small Wastewater Treatment Plants

---

## Overview

Implement an algorithm that schedules maintenance visits into optimised daily routes for a specified planning window. A dispatcher generates a draft tour, reviews and adjusts it via drag-and-drop, then publishes it to technicians. Published tours appear in the existing dashboard calendar grouped by technician.

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Algorithm | Geographic Clustering + Nearest Neighbor | Good route quality, manageable implementation, dispatcher drag-and-drop covers edge cases |
| Travel time | Google Maps Distance Matrix API | Real driving times; critical for rural areas |
| Travel time caching | DB table `reisezeiten_cache` | Avoids repeat API calls for the same coordinate pairs; TTL 90 days |
| Dispatcher interaction | Review draft → drag-and-drop adjust → publish | Human-in-the-loop; full flexibility (change day AND technician) |
| Ticket inclusion | Auto-included in draft (opt-out model) | Dispatcher sees full picture; removes unwanted tickets |
| Partial-day absences | Already supported via `user_abwesenheiten.von/bis` timestamptz | No schema change needed |
| Calendar integration | Published `tour_eintraege` shown alongside due tasks | Extends existing `TechnicianTour` component |
| Drag-and-drop library | `@dnd-kit/core` | Standard with React 19; composable, accessible |
| Published tour editing | Published tours are read-only | Dispatcher must revert to draft to edit; prevents race conditions |
| Concurrency | Last-writer-wins | Single-dispatcher assumption; acknowledged risk for multi-user scenarios |
| `touren` / `tour_eintraege` IDs | `serial` / identity columns | Intentional — only legacy tables use manual max+1 IDs |

---

## Data Model

### New Tables

#### `touren`
Tour header — one row per planning run.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | Auto-generated (identity column) |
| `name` | text | e.g. "KW 14–16 2026" |
| `von` | date | Start of planning window |
| `bis` | date | End of planning window |
| `status` | text | `'entwurf'` \| `'veröffentlicht'` |
| `created_by` | uuid FK → profiles | Dispatcher who created it |
| `partial` | boolean NOT NULL DEFAULT false | Set to true if the 60s timeout was hit; draft is incomplete |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `tour_eintraege`
One row per stop — a maintenance visit or service ticket.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | Auto-generated (identity column) |
| `tour_id` | int FK → touren | CASCADE DELETE |
| `techniker_id` | uuid FK → profiles | Who performs the visit |
| `datum` | date | Which day |
| `position` | integer | Stop order within the day (0, 1, 2…) |
| `item_type` | text | `'wartung'` \| `'ticket'` |
| `anlage_id` | int FK → anlagen, nullable | Set when `item_type = 'wartung'` |
| `ticket_id` | int FK → tickets, nullable | Set when `item_type = 'ticket'` |
| `geplante_startzeit` | time, nullable | Calculated arrival time at this stop |
| `fahrtzeit_minuten` | integer, nullable | Drive time from previous stop (Google Maps) |
| `dauer_minuten` | integer, nullable | Maintenance or service duration |
| `original_techniker_id` | uuid FK → profiles, nullable | Set when stop was reassigned due to absence coverage |
| `notizen` | text, nullable | |
| `created_at` | timestamptz | |

Check constraint (exactly one of `anlage_id`/`ticket_id` must be set, matching `item_type`):
```sql
CHECK (
  (item_type = 'wartung' AND anlage_id IS NOT NULL AND ticket_id IS NULL) OR
  (item_type = 'ticket'  AND ticket_id IS NOT NULL AND anlage_id IS NULL)
)
```

#### `reisezeiten_cache`
Cached Google Maps Distance Matrix results. Entries expire after 90 days; a background job or on-read check purges expired rows.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `von_lat` | numeric(10,7) | Origin latitude, rounded to 7 decimal places |
| `von_lng` | numeric(10,7) | Origin longitude, rounded to 7 decimal places |
| `nach_lat` | numeric(10,7) | Destination latitude, rounded to 7 decimal places |
| `nach_lng` | numeric(10,7) | Destination longitude, rounded to 7 decimal places |
| `fahrtzeit_minuten` | integer | Driving time |
| `distanz_km` | numeric(6,2) | |
| `cached_at` | timestamptz | Entries older than 90 days are treated as cache misses |

Unique constraint on `(von_lat, von_lng, nach_lat, nach_lng)`.

**Coordinate normalisation:** `anlagen.breitengrad` and `anlagen.laengengrad` are stored as `string` in the TypeScript type. Before any cache lookup or insert, convert to `numeric` and round to 7 decimal places: `Math.round(parseFloat(coord) * 1e7) / 1e7`.

---

### Extended Tables

#### `profiles` — add start location fields
Each technician has a configurable daily start point (home address or company office).

| Column | Type | Notes |
|---|---|---|
| `start_strasse` | text, nullable | Street name |
| `start_hausnr` | text, nullable | House number |
| `start_plz` | text, nullable | Postal code |
| `start_ort` | text, nullable | City |
| `start_lat` | numeric(10,7), nullable | Geocoded via Maps API on save |
| `start_lng` | numeric(10,7), nullable | Geocoded via Maps API on save |

#### `tickets` — add technician assignment and coordinates

| Column | Type | Notes |
|---|---|---|
| `techniker_id` | uuid FK → profiles, nullable | Explicitly assigned technician; null = derive from anlage or geo-match |
| `lat` | numeric(10,7), nullable | Geocoded from ticket address on save |
| `lng` | numeric(10,7), nullable | Geocoded from ticket address on save |

Tickets with `anlage_id` inherit coordinates from `anlagen.breitengrad`/`laengengrad` at algorithm runtime — no duplication needed. The `lat`/`lng` columns cover tickets without an `anlage_id`.

#### `user_abwesenheiten` — no changes required
`von` and `bis` are already `timestamptz` in the database. Full-day absences store date-only values (interpreted as midnight → midnight); partial-day absences store datetime values (e.g. `2026-03-15 08:00:00` → `2026-03-15 12:00:00`).

**TypeScript changes required:**
- `lib/types/abwesenheit.ts`: update comment on `von`/`bis` from `// ISO date string, e.g. "2026-03-15"` to `// ISO datetime string, e.g. "2026-03-15T08:00:00Z"`
- `lib/types/ticket.ts`: add `techniker_id?: string` to the `Ticket` interface (the algorithm reads this field; it must exist in the type before use)

---

## Algorithm: Geographic Clustering + Nearest Neighbor

The algorithm runs server-side as a Next.js Route Handler (not a Server Action — the Maps API batching may take 10–30s for large windows). The UI polls for completion via the returned draft `id`. A hard timeout of 60s is applied; if exceeded the draft is saved with whatever stops were computed and a `partial: true` flag on the `touren` row.

### Step 1 — Data Fetch
- Load all `wartungsvertraege` where `datum_naechste_wartung` falls within `[von, bis]`
- Join with `anlagen` to get GPS coordinates (`breitengrad`, `laengengrad`) and `techniker_id`
- Group plants by `techniker_id`
- **Plants without coordinates** (`breitengrad` or `laengengrad` is null): excluded from the tour and reported as warnings in the draft response. The dispatcher sees them in the ticket sidebar as unscheduled items.
- Load all open tickets (`status = 'offen'`) with `anlage_id` or `lat`/`lng` populated
- Load technician profiles (working hours per weekday, `start_lat`/`start_lng`)
- Load `user_abwesenheiten` for all involved technicians within the window

### Step 2 — Capacity Map
For each technician × each calendar day in the window:

```
work_start    = profile.{weekday}_von parsed as minutes-since-midnight
work_end      = profile.{weekday}_bis parsed as minutes-since-midnight
working_mins  = work_end − work_start   (0 if weekday has no hours defined)

absence_mins  = Σ overlap([work_start, work_end], each absence interval on this date)
available_mins = max(0, working_mins − absence_mins)
route_start   = first minute from work_start not covered by any absence interval
```

Result: `capacity[technician_id][date]` and `routeStart[technician_id][date]`.

### Step 3 — Travel Time Matrix (Google Maps)
For each technician:
1. Collect all plant/ticket coordinates + technician's `start_lat`/`start_lng`; normalise to `numeric(10,7)`
2. Check `reisezeiten_cache` for each ordered pair; skip pairs with `cached_at` older than 90 days
3. For cache misses, call the Google Maps Distance Matrix API in **parallel batches** of ≤25 origins × ≤25 destinations (`Promise.all` with a concurrency limit of 5 simultaneous requests to stay within API rate limits)
4. Store results in `reisezeiten_cache` (upsert on conflict)
5. Output: N×N matrix of driving minutes for each technician

### Step 4 — Geographic Clustering (k-means)
For each technician independently:
- `k` = number of days with `available_mins > 0` in the window
- **If `k <= 2`:** skip k-means; assign all plants to available days by capacity using a greedy fill, then go directly to Step 5
- **If `k > 2`:** run k-means++ on GPS coordinates with a deterministic seed (derived from `tour.id` for reproducibility) and convergence criterion of max 100 iterations or centroid movement < 0.0001°
- Assign clusters to days ordered by proximity of cluster centroid to the technician's start location (closest cluster → earliest available day)
- **Capacity overflow:** if a cluster's total `dauer_wartung_minuten` exceeds `available_mins` for its day, move the farthest plant(s) to the next available day; if no next available day exists, pass overflowed plants to Step 6

### Step 5 — Route Ordering (Nearest Neighbor TSP)
For each technician's day cluster:
1. Start at `start_lat`/`start_lng`
2. Greedily pick the nearest unvisited plant by cached drive time
3. Repeat until all plants visited
4. Calculate arrival times: accumulate `route_start + Σ(fahrtzeit_minuten + dauer_minuten)` per stop

### Step 6 — Absence Redistribution
For plants passed from Step 4 overflow or whose technician has zero available days in the window:
1. **Defer first:** if the technician has any day with `available_mins > 0` in the window, assign the plant to the day with the most remaining capacity; re-run Step 5 for that day
2. **Redistribute if fully absent:** find the available technician whose existing day centroid is geographically nearest to the plant's coordinates. Insert the plant into that technician's day with the most remaining capacity; re-run Step 5 for that day; set `original_techniker_id` on the new `tour_eintraege` row

### Step 7 — Ticket Assignment
All open tickets are auto-included. Technician lookup priority:
1. `tickets.techniker_id` if set
2. `anlagen.techniker_id` via `tickets.anlage_id`
3. Geographically nearest available technician (same definition as Step 6: technician with `available_mins > 0` on at least one day)

Tickets are inserted in priority order: `dringend` first, then `hoch`, then `normal`. Each ticket is inserted into the best-fit day for the resolved technician (most remaining capacity) and Step 5 is re-run for that day.

**Priority and manual sidebar drops:** when a ticket is manually dragged in from the sidebar, it is inserted at the drop position — no automatic priority reordering. The dispatcher controls placement manually.

### Step 8 — Save Draft
- Update `tickets.status` to `'eingeplant'` for all tickets included in the draft
- Create one `touren` row with `status = 'entwurf'`
- Create `tour_eintraege` rows for every stop with `geplante_startzeit`, `fahrtzeit_minuten`, `dauer_minuten`, `position`
- Return `{ tourId, warnings: string[] }` — warnings list plants excluded due to missing coordinates

**Tour deletion / ticket removal:** when a tour is deleted or a ticket stop is removed from the tour, the corresponding `tickets.status` reverts to `'offen'`.

**Publish action:** sets `touren.status = 'veröffentlicht'`. Published tours are read-only in the UI. A "Zurück zu Entwurf" action reverts status to `'entwurf'` for further editing.

---

## UI

### Route: `/master-data/tours/`
Tour list page — extends the existing stub at `app/(dashboard)/master-data/tours/page.tsx`. Shows all tours with columns: name, planning window, status badge, technician count, stop count, created by, created date. Empty state: "Noch keine Touren erstellt." Entry point: existing "Neue Tourplanung" button in the dashboard calendar header (currently stubs `console.log` — wire to navigate to `/master-data/tours/new` or trigger the planning dialog that navigates on creation).

**`TourPlanningDialog` integration:** the existing dialog passes `startWeek` / `endWeek` as ISO week numbers. Convert to `date` values (Monday of `startWeek` → Sunday of `endWeek`) before calling `createTourDraft`. On success, navigate to `/master-data/tours/[id]`.

### Route: `/master-data/tours/[id]`
Tour planning page — main dispatcher workspace.

**Layout: Timeline Grid**
- Top toolbar: tour name (editable inline), date range, week navigation tabs (KW 14 / KW 15…), status badge, "Veröffentlichen" button (disabled if `status = 'veröffentlicht'`), "Zurück zu Entwurf" button (visible when published)
- Main grid: technicians as rows, days as columns (Mon–Fri per week tab)
- Each cell shows:
  - Ordered stop cards: facility/ticket name, estimated arrival time, drive time from previous stop, maintenance duration
  - Capacity bar (used minutes / available minutes)
  - Absence hatching for unavailable days (zero capacity)
  - `Vertretung` badge (amber) on stops with `original_techniker_id` set
  - `Ticket` badge (red) on ticket stops; `dringend` highlighted in red
- Right sidebar: open tickets not yet in the tour; each shows priority badge, title, address, resolved technician; can be dragged into a cell or dismissed (reverts to `'offen'`)
- Warning banner if draft has unscheduled plants (missing coordinates)

**Drag-and-drop** (`@dnd-kit/core`):
- Stops can be moved to a different day cell (horizontal) or a different technician row (vertical)
- On drop, call `moveTourEintrag(stopId, newTechnikerId, newDatum, newPosition)` — atomically updates `position` and `techniker_id`/`datum` for all affected stops in both the source and target days within a single DB transaction, then recalculates `geplante_startzeit` and `fahrtzeit_minuten` for both days
- Travel times for new stop pairs are checked against `reisezeiten_cache` first; if the pair is a cache miss, recalculate with a Maps API call (UI shows a brief loading indicator on the affected cell)
- Updates are **pessimistic** (wait for server confirmation before re-rendering) to avoid position conflicts

**"Route neu berechnen" button per day cell:**
- Appears in the cell header; manually triggers `reoptimiseDay(tourId, technikerId, datum)`
- Re-runs Nearest Neighbor (Step 5) on the current stops for that day using cached travel times only (<100ms)
- The dispatcher's manual stop order is preserved until this button is explicitly pressed — useful when a customer requires a specific arrival sequence

### Dashboard Calendar — Extended
The existing `MaintenanceCalendar` and `TechnicianTour` components are extended:
- Feed published `tour_eintraege` as a second data source alongside `wartungsvertraege` due dates
- **Card display rule:** if a `tour_eintraege` record exists for a plant on a given day, show **only** the "Geplant" card variant (replaces the "Due" card — no duplicate). If no tour entry exists, show the "Due" card as today.
  - **"Due" card** (existing): traffic light `MaintenanceStatus`, contact info
  - **"Geplant" card** (new): `Eingeplant` badge, estimated arrival time, drive time from previous stop
- Same technician filter applies to both data sources
- No change to the existing grid layout or week navigation

---

## App Structure

```
app/(dashboard)/
  master-data/
    tours/
      page.tsx              # Tour list (extends existing stub)
      [id]/
        page.tsx            # Tour planning page (dispatcher workspace)

lib/
  types/
    tour.ts                 # Tour, TourEintrag, TourStatus types
  data/
    touren.ts               # getTouren, getTourById, getTourEintraege
  actions/
    touren.ts               # createTourDraft, moveTourEintrag, reoptimiseDay,
                            # publishTour, revertToDraft, deleteTour
  algorithm/
    tour-planning.ts        # Main entry point — orchestrates steps 1–8
    capacity.ts             # Step 2: capacity map per technician per day
    travel-matrix.ts        # Step 3: Google Maps Distance Matrix + cache
    clustering.ts           # Step 4: k-means++ geographic clustering
    routing.ts              # Step 5 & reoptimiseDay: Nearest Neighbor TSP
    absence-cover.ts        # Step 6: absence redistribution
    ticket-assignment.ts    # Step 7: ticket technician resolution + insertion

components/dashboard/
  tour-grid.tsx             # Timeline Grid (dispatcher view)
  tour-stop-card.tsx        # Individual stop card (wartung or ticket variant)
  tour-ticket-sidebar.tsx   # Open tickets sidebar with drag source
```

---

## Known Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Maps API latency for large windows (100+ API calls) | Parallel batches with concurrency limit 5; 60s Route Handler timeout; partial draft saved on timeout |
| k-means poor results for k ≤ 2 or linear plant layouts | Skip k-means for k ≤ 2; fallback to greedy capacity fill |
| Plants without GPS coordinates excluded silently | Warning list returned in draft response; shown as banner in planning UI |
| DnD drop requires Maps API call for uncached pairs | Pessimistic update; loading indicator on affected cell |
| Two dispatchers editing the same draft simultaneously | Last-writer-wins; acknowledged risk; single-dispatcher assumption for v1 |

---

## Out of Scope (Future)

- Clarke-Wright Savings Algorithm (enterprise tier, better route quality for 50+ plants/technician)
- Mobile technician view (route turn-by-turn)
- Export to PDF / calendar (ICS)
- Reassigning plants between technicians as a permanent change (separate from tour-level overrides)
