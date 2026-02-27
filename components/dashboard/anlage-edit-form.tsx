"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateAnlage, type UpdateAnlageInput } from "@/lib/actions/anlagen";
import type { AnlTyp, AnlageListItem } from "@/lib/types/anlage";
import type { Kontakt } from "@/lib/types/kontakt";
import { KundePicker } from "@/components/dashboard/kunde-picker";
import {
  KontaktSection,
  type KontaktSectionRef,
} from "@/components/dashboard/kontakt-section";
import { Loader2, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AnlageEditFormProps {
  anlage: AnlageListItem;
  anlTypen: AnlTyp[];
  initialKontakt?: Kontakt;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AnlageEditForm({ anlage, anlTypen, initialKontakt }: AnlageEditFormProps) {
  const kontaktRef = useRef<KontaktSectionRef>(null);

  const initialContactMode: "none" | "kunde" | "kontakt" =
    anlage.kontakt_kunde_id != null
      ? "kunde"
      : anlage.kontakt_id != null
      ? "kontakt"
      : "none";

  const initialKundeInfo =
    anlage.kontakt_kunde_id != null
      ? {
          id: anlage.kontakt_kunde_id,
          name: anlage.kontakt_name ?? `Kunde #${anlage.kontakt_kunde_id}`,
          address: [
            [anlage.kontakt_strasse, anlage.kontakt_hausnr]
              .filter(Boolean)
              .join(" "),
            [anlage.kontakt_plz, anlage.kontakt_ort]
              .filter(Boolean)
              .join(" "),
          ]
            .filter(Boolean)
            .join(", "),
        }
      : undefined;

  const [form, setForm] = useState<UpdateAnlageInput>({
    anl_typ_id: anlage.anl_typ_id ?? null,
    kunden_id: anlage.kunden_id,
    anlagen_nr: anlage.anlagen_nr ?? "",
    bezeichnung: anlage.bezeichnung ?? "",
    verfahren_br_anz_behaelter: anlage.verfahren_br_anz_behaelter ?? undefined,
    strasse: anlage.strasse ?? "",
    hausnr: anlage.hausnr ?? "",
    laenderkennung: anlage.laenderkennung ?? "",
    plz: anlage.plz ?? "",
    ort: anlage.ort ?? "",
    ortsteil: anlage.ortsteil ?? "",
    gemarkung: anlage.gemarkung ?? "",
    flur: anlage.flur ?? "",
    flurstueck: anlage.flurstueck ?? "",
    rechtswert: anlage.rechtswert ?? "",
    hochwert: anlage.hochwert ?? "",
    breitengrad: anlage.breitengrad ?? "",
    laengengrad: anlage.laengengrad ?? "",
    anlage_ausgelegt_ew: anlage.anlage_ausgelegt_ew ?? undefined,
    tatsaechliche_ew: anlage.tatsaechliche_ew ?? undefined,
    gesamtgroesse_vk: anlage.gesamtgroesse_vk ?? undefined,
    touren_nr: anlage.touren_nr ?? "",
    touren_nr2: anlage.touren_nr2 ?? "",
    touren_nr3: anlage.touren_nr3 ?? "",
    datum_abgabefrei_seit: anlage.datum_abgabefrei_seit ?? "",
    ansprechpartner_legacy: anlage.ansprechpartner_legacy ?? "",
    telefonnr_legacy: anlage.telefonnr_legacy ?? "",
    comment: anlage.comment ?? "",
    anmerkungen_gesamt: anlage.anmerkungen_gesamt ?? "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (
    field: keyof UpdateAnlageInput,
    value: string | boolean | number | null
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    setError(null);

    // Save contact person first (may create/update a kontakte record)
    const kontaktResult = await kontaktRef.current?.save();
    if (kontaktResult?.error) {
      setError(kontaktResult.error);
      setIsSaving(false);
      return;
    }

    const result = await updateAnlage(anlage.id, {
      ...form,
      kontakt_kunde_id: kontaktResult?.kontakt_kunde_id ?? null,
      kontakt_id: kontaktResult?.kontakt_id ?? null,
    });

    setIsSaving(false);
    if (!result.success) {
      setError(result.error ?? "Unbekannter Fehler.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const displayName = `Anlage: ${anlage.anlagen_nr ?? anlage.id}`;

  const metaInfo = [
    anlage.anlagen_nr && `Anl.-Nr.: ${anlage.anlagen_nr}`,
    anlage.created_at && `Erstellt: ${formatDateTime(anlage.created_at)}`,
    anlage.last_update && `Geändert: ${formatDateTime(anlage.last_update)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href="/master-data/facilities">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Link>
        </Button>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            {metaInfo && (
              <p className="text-sm text-muted-foreground mt-0.5">{metaInfo}</p>
            )}
          </div>
          <Button type="submit" disabled={isSaving} className="shrink-0">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Stammdaten ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stammdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Anlagen-Nr. */}
            <div className="space-y-1.5">
              <Label htmlFor="anlagen_nr">Anlagen-Nr.</Label>
              <Input
                id="anlagen_nr"
                value={form.anlagen_nr}
                onChange={(e) => set("anlagen_nr", e.target.value)}
                placeholder="z. B. AS-290"
              />
            </div>

            {/* Anlagentyp */}
            <div className="space-y-1.5">
              <Label htmlFor="anl_typ_id">Anlagentyp</Label>
              <Select
                value={form.anl_typ_id != null ? String(form.anl_typ_id) : "none"}
                onValueChange={(v) =>
                  set("anl_typ_id", v === "none" ? null : parseInt(v, 10))
                }
              >
                <SelectTrigger id="anl_typ_id">
                  <SelectValue placeholder="Typ auswählen…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Kein Typ —</SelectItem>
                  {anlTypen.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.bezeichnung}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Eigentümer */}
            <div className="space-y-1.5">
              <Label>Eigentümer <span className="text-destructive">*</span></Label>
              <KundePicker
                value={form.kunden_id ?? null}
                onChange={(id) => set("kunden_id", id ?? 0)}
                initial={{
                  id: anlage.kunden_id,
                  name: anlage.owner_name ?? `Kunde #${anlage.kunden_id}`,
                  address: [
                    [anlage.owner_strasse, anlage.owner_hausnr]
                      .filter(Boolean)
                      .join(" "),
                    [anlage.owner_plz, anlage.owner_ort]
                      .filter(Boolean)
                      .join(" "),
                  ]
                    .filter(Boolean)
                    .join(", "),
                }}
              />
            </div>

            {/* Bezeichnung */}
            <div className="space-y-1.5">
              <Label htmlFor="bezeichnung">Bezeichnung</Label>
              <Input
                id="bezeichnung"
                value={form.bezeichnung}
                onChange={(e) => set("bezeichnung", e.target.value)}
              />
            </div>

            {/* Verfahren */}
            <div className="space-y-1.5">
              <Label htmlFor="verfahren_br_anz_behaelter">
                Anzahl Vorklärbehälter
              </Label>
              <Input
                id="verfahren_br_anz_behaelter"
                type="number"
                min={0}
                value={form.verfahren_br_anz_behaelter ?? ""}
                onChange={(e) =>
                  set(
                    "verfahren_br_anz_behaelter",
                    e.target.value === "" ? null : parseInt(e.target.value, 10)
                  )
                }
              />
            </div>

            {/* EW + Gesamtgröße VK */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="anlage_ausgelegt_ew">Ausgelegt EW</Label>
                <Input
                  id="anlage_ausgelegt_ew"
                  type="number"
                  min={0}
                  value={form.anlage_ausgelegt_ew ?? ""}
                  onChange={(e) =>
                    set(
                      "anlage_ausgelegt_ew",
                      e.target.value === "" ? null : parseInt(e.target.value, 10)
                    )
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tatsaechliche_ew">Tatsächliche EW</Label>
                <Input
                  id="tatsaechliche_ew"
                  type="number"
                  min={0}
                  value={form.tatsaechliche_ew ?? ""}
                  onChange={(e) =>
                    set(
                      "tatsaechliche_ew",
                      e.target.value === "" ? null : parseInt(e.target.value, 10)
                    )
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gesamtgroesse_vk">Gesamtgröße VK</Label>
                <Input
                  id="gesamtgroesse_vk"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.gesamtgroesse_vk ?? ""}
                  onChange={(e) =>
                    set(
                      "gesamtgroesse_vk",
                      e.target.value === "" ? null : parseFloat(e.target.value)
                    )
                  }
                />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ── Adresse ────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anlagenstandort</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid grid-cols-[1fr_100px] gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="strasse">Straße</Label>
                <Input
                  id="strasse"
                  value={form.strasse}
                  onChange={(e) => set("strasse", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hausnr">Nr.</Label>
                <Input
                  id="hausnr"
                  value={form.hausnr}
                  onChange={(e) => set("hausnr", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-[64px_90px_1fr] gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="laenderkennung">Land</Label>
                <Input
                  id="laenderkennung"
                  value={form.laenderkennung}
                  onChange={(e) => set("laenderkennung", e.target.value)}
                  placeholder="DE"
                  maxLength={5}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plz">PLZ</Label>
                <Input
                  id="plz"
                  value={form.plz}
                  onChange={(e) => set("plz", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ort">Ort</Label>
                <Input
                  id="ort"
                  value={form.ort}
                  onChange={(e) => set("ort", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ortsteil">Ortsteil</Label>
              <Input
                id="ortsteil"
                value={form.ortsteil}
                onChange={(e) => set("ortsteil", e.target.value)}
              />
            </div>

            {/* Cadastral */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="gemarkung">Gemarkung</Label>
                <Input
                  id="gemarkung"
                  value={form.gemarkung}
                  onChange={(e) => set("gemarkung", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="flur">Flur</Label>
                <Input
                  id="flur"
                  value={form.flur}
                  onChange={(e) => set("flur", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="flurstueck">Flurstück</Label>
                <Input
                  id="flurstueck"
                  value={form.flurstueck}
                  onChange={(e) => set("flurstueck", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="breitengrad">Breitengrad</Label>
                <Input
                  id="breitengrad"
                  value={form.breitengrad}
                  onChange={(e) => set("breitengrad", e.target.value)}
                  placeholder="z. B. 51.123456"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="laengengrad">Längengrad</Label>
                <Input
                  id="laengengrad"
                  value={form.laengengrad}
                  onChange={(e) => set("laengengrad", e.target.value)}
                  placeholder="z. B. 9.123456"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="rechtswert">Rechtswert</Label>
                <Input
                  id="rechtswert"
                  value={form.rechtswert}
                  onChange={(e) => set("rechtswert", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hochwert">Hochwert</Label>
                <Input
                  id="hochwert"
                  value={form.hochwert}
                  onChange={(e) => set("hochwert", e.target.value)}
                />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ── Wartung & Planung ───────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Wartung &amp; Planung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="space-y-1.5">
              <Label htmlFor="datum_abgabefrei_seit">Abgabefrei seit</Label>
              <Input
                id="datum_abgabefrei_seit"
                type="date"
                value={form.datum_abgabefrei_seit}
                onChange={(e) => set("datum_abgabefrei_seit", e.target.value)}
              />
            </div>

            {/* Touren */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="touren_nr">Tour 1</Label>
                <Input
                  id="touren_nr"
                  value={form.touren_nr}
                  onChange={(e) => set("touren_nr", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="touren_nr2">Tour 2</Label>
                <Input
                  id="touren_nr2"
                  value={form.touren_nr2}
                  onChange={(e) => set("touren_nr2", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="touren_nr3">Tour 3</Label>
                <Input
                  id="touren_nr3"
                  value={form.touren_nr3}
                  onChange={(e) => set("touren_nr3", e.target.value)}
                />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ── Anmerkungen ────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anmerkungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ansprechpartner_legacy">Ansprechpartner</Label>
                <Input
                  id="ansprechpartner_legacy"
                  value={form.ansprechpartner_legacy}
                  onChange={(e) =>
                    set("ansprechpartner_legacy", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefonnr_legacy">Telefon (Anlage)</Label>
                <Input
                  id="telefonnr_legacy"
                  type="tel"
                  value={form.telefonnr_legacy}
                  onChange={(e) => set("telefonnr_legacy", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comment">Kommentar</Label>
              <Textarea
                id="comment"
                rows={3}
                value={form.comment}
                onChange={(e) => set("comment", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="anmerkungen_gesamt">Anmerkungen gesamt</Label>
              <Textarea
                id="anmerkungen_gesamt"
                rows={3}
                value={form.anmerkungen_gesamt}
                onChange={(e) => set("anmerkungen_gesamt", e.target.value)}
              />
            </div>

          </CardContent>
        </Card>

        {/* ── Ansprechpartner ────────────────────────────────────── */}
        <KontaktSection
          ref={kontaktRef}
          initialMode={initialContactMode}
          initialKundeId={anlage.kontakt_kunde_id}
          initialKundeInfo={initialKundeInfo}
          initialKontakt={initialKontakt}
        />

      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-8">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && saved && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <Check className="h-4 w-4" /> Gespeichert
          </p>
        )}
        {!error && !saved && <span />}
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Speichern
        </Button>
      </div>
    </form>
  );
}
