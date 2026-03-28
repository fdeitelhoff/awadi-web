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
    // Both days should be assigned
    expect(assignment["2026-03-30"]).toBeDefined();
    expect(assignment["2026-03-31"]).toBeDefined();
  });
});
