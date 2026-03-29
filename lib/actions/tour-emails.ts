"use server";

import { createClient } from "@/lib/supabase/server";
import type { KundenStatus } from "@/lib/types/wartung";
import { revalidatePath } from "next/cache";

function buildEmailBody(params: {
  name: string;
  datum: string;
  anlagenNr: string;
  adresse: string;
  startzeit?: string;
  technikerName?: string;
  dauerMinuten?: number;
}): string {
  const datumFormatted = new Date(params.datum + "T12:00:00Z").toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return [
    `Sehr geehrte/r ${params.name},`,
    "",
    `hiermit möchten wir Ihnen mitteilen, dass am ${datumFormatted} eine Wartung Ihrer`,
    `Kleinkläranlage ${params.anlagenNr} (${params.adresse}) geplant ist.`,
    "",
    params.startzeit ? `Geplante Ankunft: ${params.startzeit.slice(0, 5)} Uhr` : null,
    params.technikerName ? `Techniker: ${params.technikerName}` : null,
    params.dauerMinuten ? `Geschätzte Dauer: ca. ${params.dauerMinuten} Minuten` : null,
    "",
    "Bitte bestätigen Sie diesen Termin oder nehmen Sie Kontakt mit uns auf,",
    "falls Sie einen anderen Termin bevorzugen.",
    "",
    "Mit freundlichen Grüßen,",
    "Ihr AWADI-Team",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export async function sendTourEintragEmail(
  eintragId: number
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: eintrag, error: e1 } = await supabase
    .from("tour_eintraege")
    .select(
      "id, tour_id, item_type, anlage_id, datum, geplante_startzeit, dauer_minuten, profiles!tour_eintraege_techniker_id_fkey(vorname, nachname)"
    )
    .eq("id", eintragId)
    .single();

  if (e1 || !eintrag) return { error: "Eintrag nicht gefunden" };
  if (eintrag.item_type !== "wartung")
    return { error: "Nur Wartungseinträge können benachrichtigt werden" };

  const { data: anlage } = await supabase
    .from("anlagen_details")
    .select("anlagen_nr, strasse, hausnr, ort, kontakt_email, kontakt_name, owner_email, owner_name")
    .eq("id", eintrag.anlage_id)
    .single();

  const email = anlage?.kontakt_email || anlage?.owner_email;
  const name = anlage?.kontakt_name || anlage?.owner_name || "Kunde";

  if (!email) return { error: "Keine E-Mail-Adresse für diese Anlage hinterlegt" };

  const profile = eintrag.profiles as { vorname?: string; nachname?: string } | null;
  const technikerName = profile
    ? [profile.vorname, profile.nachname].filter(Boolean).join(" ") || undefined
    : undefined;
  const adresse = [anlage?.strasse, anlage?.hausnr, anlage?.ort].filter(Boolean).join(" ");

  const body = buildEmailBody({
    name,
    datum: eintrag.datum as string,
    anlagenNr: anlage?.anlagen_nr ?? String(eintrag.anlage_id),
    adresse,
    startzeit: eintrag.geplante_startzeit as string | undefined,
    technikerName,
    dauerMinuten: eintrag.dauer_minuten as number | undefined,
  });

  // TODO: Replace with actual email provider, e.g. Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: "AWADI <noreply@awadi.de>",
  //   to: email,
  //   subject: `Wartungstermin am ${datum}`,
  //   text: body,
  // });
  console.log(`[EMAIL] To: ${name} <${email}>\n${body}`);

  const { error: e2 } = await supabase
    .from("tour_eintraege")
    .update({ kunden_status: "email_versendet" })
    .eq("id", eintragId);

  if (e2) return { error: e2.message };

  revalidatePath("/");
  revalidatePath(`/master-data/tours/${eintrag.tour_id as number}`);
  return {};
}

export async function sendAllTourEmails(
  tourId: number
): Promise<{ sent: number; errors: string[] }> {
  const supabase = await createClient();

  const { data: ids } = await supabase
    .from("tour_eintraege")
    .select("id")
    .eq("tour_id", tourId)
    .eq("item_type", "wartung")
    .eq("kunden_status", "ausstehend");

  const results = await Promise.all((ids ?? []).map((r) => sendTourEintragEmail(r.id)));
  return {
    sent: results.filter((r) => !r.error).length,
    errors: results.filter((r) => r.error).map((r) => r.error!),
  };
}

export async function updateKundenStatus(
  eintragId: number,
  status: KundenStatus,
  tourId: number
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tour_eintraege")
    .update({ kunden_status: status })
    .eq("id", eintragId);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath(`/master-data/tours/${tourId}`);
  return {};
}
