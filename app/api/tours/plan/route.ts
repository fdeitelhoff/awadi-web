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
    const result = await runTourPlanning(tour.id, von, bis, mapsApiKey);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Tour planning error:", err);
    // Mark tour as partial on unexpected failure
    await supabase.from("touren").update({ partial: true }).eq("id", tour.id);
    return NextResponse.json({ tourId: tour.id, warnings: ["Planung unvollständig."], partial: true });
  }
}
