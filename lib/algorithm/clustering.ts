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

  // Lloyd's algorithm (max 100 iterations)
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

  // Final assignment after max iterations
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
