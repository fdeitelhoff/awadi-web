"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchResultType =
  | "kunde"
  | "anlage"
  | "kontakt"
  | "wartungsvertrag"
  | "anlagentyp"
  | "benutzer";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  label: string;
  sublabel?: string;
  href: string;
}

const LIMIT = 3;

export async function searchAll(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const supabase = await createClient();
  // Escape PostgREST .or() filter syntax delimiters
  const safeQ = query.trim().replace(/[,()\\]/g, "\\$&");
  const q = `%${safeQ}%`;

  const [kunden, anlagen, kontakte, vertraege, typen, benutzer] =
    await Promise.all([
      supabase
        .from("kunden")
        .select("id, nachname, vorname, firma, kundennr")
        .or(
          `nachname.ilike.${q},vorname.ilike.${q},firma.ilike.${q},kundennr.ilike.${q},email.ilike.${q},ort.ilike.${q}`,
        )
        .limit(LIMIT),

      supabase
        .from("anlagen")
        .select("id, anlagen_nr, ort")
        .or(
          `anlagen_nr.ilike.${q},ort.ilike.${q},strasse.ilike.${q},plz.ilike.${q}`,
        )
        .limit(LIMIT),

      supabase
        .from("kontakte")
        .select("id, nachname, vorname, firma, email")
        .or(
          `nachname.ilike.${q},vorname.ilike.${q},firma.ilike.${q},email.ilike.${q},ort.ilike.${q}`,
        )
        .limit(LIMIT),

      supabase
        .from("wartungsvertraege")
        .select("id, vertragsnummer, gueltig_ab, gueltig_bis")
        .or(`vertragsnummer.ilike.${q},comment.ilike.${q}`)
        .limit(LIMIT),

      supabase
        .from("anl_typen")
        .select("id, bezeichnung, wartungsintervall_monate, preis_je_wartung")
        .or(`bezeichnung.ilike.${q},comment.ilike.${q}`)
        .limit(LIMIT),

      supabase
        .from("profiles")
        .select("id, vorname, nachname, email")
        .or(`vorname.ilike.${q},nachname.ilike.${q},email.ilike.${q}`)
        .limit(LIMIT),
    ]);

  if (kunden.error) console.error("[search] kunden:", kunden.error.message);
  if (anlagen.error) console.error("[search] anlagen:", anlagen.error.message);
  if (kontakte.error)
    console.error("[search] kontakte:", kontakte.error.message);
  if (vertraege.error)
    console.error("[search] vertraege:", vertraege.error.message);
  if (typen.error) console.error("[search] typen:", typen.error.message);
  if (benutzer.error)
    console.error("[search] benutzer:", benutzer.error.message);

  const results: SearchResult[] = [];

  for (const k of kunden.data ?? []) {
    results.push({
      id: String(k.id),
      type: "kunde",
      label:
        k.firma ||
        [k.vorname, k.nachname].filter(Boolean).join(" ") ||
        "–",
      sublabel: k.kundennr ?? undefined,
      href: `/master-data/customers/${k.id}`,
    });
  }

  for (const a of anlagen.data ?? []) {
    results.push({
      id: String(a.id),
      type: "anlage",
      label: a.anlagen_nr || String(a.id),
      sublabel: a.ort ?? undefined,
      href: `/master-data/facilities/${a.id}`,
    });
  }

  for (const k of kontakte.data ?? []) {
    results.push({
      id: String(k.id),
      type: "kontakt",
      label:
        k.firma ||
        [k.vorname, k.nachname].filter(Boolean).join(" ") ||
        "–",
      sublabel: k.email ?? undefined,
      href: `/master-data/contacts/${k.id}`,
    });
  }

  for (const v of vertraege.data ?? []) {
    const parts = [v.gueltig_ab, v.gueltig_bis].filter(Boolean);
    results.push({
      id: String(v.id),
      type: "wartungsvertrag",
      label: v.vertragsnummer || String(v.id),
      sublabel: parts.length ? parts.join(" – ") : undefined,
      href: `/master-data/maintenance/${v.id}`,
    });
  }

  for (const t of typen.data ?? []) {
    const parts: string[] = [];
    if (t.wartungsintervall_monate)
      parts.push(`${t.wartungsintervall_monate} Monate`);
    if (t.preis_je_wartung)
      parts.push(
        `${Number(t.preis_je_wartung).toFixed(2).replace(".", ",")} €`,
      );
    results.push({
      id: String(t.id),
      type: "anlagentyp",
      label: t.bezeichnung,
      sublabel: parts.length ? parts.join(" · ") : undefined,
      href: `/settings/facility-types/${t.id}`,
    });
  }

  for (const p of benutzer.data ?? []) {
    results.push({
      id: String(p.id),
      type: "benutzer",
      label:
        [p.vorname, p.nachname].filter(Boolean).join(" ") ||
        p.email ||
        "–",
      sublabel: p.email ?? undefined,
      href: `/settings/users/${p.id}`,
    });
  }

  return results;
}
