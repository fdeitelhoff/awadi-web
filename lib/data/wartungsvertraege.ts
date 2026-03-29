import { createClient } from "@/lib/supabase/server";
import type { WartungsKalenderEintrag, KalenderTechniker } from "@/lib/types/wartung";

const FALLBACK_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#ef4444", "#06b6d4", "#ec4899", "#14b8a6",
];

export async function getWartungskalenderEintraege(
  von: string,
  bis: string
): Promise<WartungsKalenderEintrag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wartungsvertraege")
    .select(
      "id, anlage_id, datum_naechste_wartung, dauer_wartung_minuten, anlagen(anlagen_nr, strasse, hausnr, ort, techniker_id)"
    )
    .gte("datum_naechste_wartung", von)
    .lte("datum_naechste_wartung", bis)
    .not("datum_naechste_wartung", "is", null);

  if (error) {
    console.error("getWartungskalenderEintraege:", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const anlage = row.anlagen as unknown as Record<string, unknown> | null;
    const adresse = anlage
      ? [anlage.strasse, anlage.hausnr, anlage.ort].filter(Boolean).join(" ") || undefined
      : undefined;
    return {
      id: row.id as number,
      anlage_id: row.anlage_id as number,
      anlage_name: (anlage?.anlagen_nr as string | undefined) ?? undefined,
      anlage_adresse: adresse,
      datum: row.datum_naechste_wartung as string,
      techniker_id: (anlage?.techniker_id as string | undefined) ?? undefined,
      dauer_minuten: (row.dauer_wartung_minuten as number | undefined) ?? undefined,
    };
  });
}

export async function getAktiveTechniker(): Promise<KalenderTechniker[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, vorname, nachname, farbe")
    .eq("aktiv", true)
    .order("nachname");

  if (error) {
    console.error("getAktiveTechniker:", error);
    return [];
  }

  return (data ?? []).map((p, i) => {
    const name =
      [p.vorname, p.nachname].filter(Boolean).join(" ") || (p.id as string).slice(0, 8);
    const kuerzel =
      [(p.vorname as string | undefined)?.[0], (p.nachname as string | undefined)?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase() || "?";
    return {
      id: p.id as string,
      name,
      farbe: (p.farbe as string | undefined) ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      kuerzel,
    };
  });
}
