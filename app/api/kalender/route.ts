import { NextRequest, NextResponse } from "next/server";
import { getPublishedTourEintraegeForDateRange } from "@/lib/data/touren";
import { getWartungskalenderEintraege } from "@/lib/data/wartungsvertraege";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const von = req.nextUrl.searchParams.get("von") ?? "";
  const bis = req.nextUrl.searchParams.get("bis") ?? "";

  if (!isoDate.test(von) || !isoDate.test(bis) || bis < von) {
    return NextResponse.json({ error: "Ungültiger Zeitraum" }, { status: 400 });
  }

  const [publishedEintraege, wartungseintraege] = await Promise.all([
    getPublishedTourEintraegeForDateRange(von, bis),
    getWartungskalenderEintraege(von, bis),
  ]);

  return NextResponse.json({ publishedEintraege, wartungseintraege });
}
