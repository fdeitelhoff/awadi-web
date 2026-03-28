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
        const json = await res.json() as {
          rows?: Array<{ elements: Array<{ status: string; duration: { value: number }; distance: { value: number } }> }>
        };
        for (let r = 0; r < (json.rows ?? []).length; r++) {
          for (let c = 0; c < (json.rows![r]!.elements ?? []).length; c++) {
            const el = json.rows![r]!.elements[c]!;
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

  return new Map([...cached, ...fresh]);
}
