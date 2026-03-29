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
import { updateAnlage, type UpdateAnlageInput } from "@/lib/actions/anlagen";
import { updateVertrag, createVertrag } from "@/lib/actions/vertraege";
import type { AnlTyp, AnlageListItem } from "@/lib/types/anlage";
import type { Kontakt } from "@/lib/types/kontakt";
import type { InternalComment } from "@/lib/types/kommentar";
import type { Vertrag } from "@/lib/types/vertrag";
import { InternalComments } from "@/components/dashboard/internal-comments";
import { KundePicker } from "@/components/dashboard/kunde-picker";
import {
  KontaktSection,
  type KontaktSectionRef,
} from "@/components/dashboard/kontakt-section";
import {
  WartungsdatenCard,
  type WartungsdatenCardRef,
} from "@/components/dashboard/wartungsdaten-card";
import { Loader2, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AnlageLocationMap } from "@/components/dashboard/anlage-location-map";

interface AnlageEditFormProps {
  anlage: AnlageListItem;
  anlTypen: AnlTyp[];
  techniker: { id: string; name: string }[];
  initialKontakt?: Kontakt;
  initialKommentare: InternalComment[];
  initialVertrag?: Vertrag | null;
  mapsApiKey: string;
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

export function AnlageEditForm({ anlage, anlTypen, techniker, initialKontakt, initialKommentare, initialVertrag, mapsApiKey }: AnlageEditFormProps) {
  const kontaktRef = useRef<KontaktSectionRef>(null);
  const wartungsdatenRef = useRef<WartungsdatenCardRef>(null);

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
    hersteller: anlage.hersteller ?? "",
    typ: anlage.typ ?? "",
    techniker_id: anlage.techniker_id ?? null,
    kunden_id: anlage.kunden_id,
    anlagen_nr: anlage.anlagen_nr ?? "",
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
    breitengrad: anlage.breitengrad ?? "",
    laengengrad: anlage.laengengrad ?? "",
    anlage_ausgelegt_ew: anlage.anlage_ausgelegt_ew ?? undefined,
    tatsaechliche_ew: anlage.tatsaechliche_ew ?? undefined,
    gesamtgroesse_vk: anlage.gesamtgroesse_vk ?? undefined,
    groesse_vk1: anlage.groesse_vk1 ?? undefined,
    groesse_vk2: anlage.groesse_vk2 ?? undefined,
    groesse_vk3: anlage.groesse_vk3 ?? undefined,
    groesse_vk4: anlage.groesse_vk4 ?? undefined,
    cleaning_class: anlage.cleaning_class ?? "",
    oxygen_demand_class: anlage.oxygen_demand_class ?? "",
    discharged_in: anlage.discharged_in ?? "",
    number_of_biologies: anlage.number_of_biologies ?? undefined,
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

    const [anlageResult, wData] = await Promise.all([
      updateAnlage(anlage.id, {
        ...form,
        kontakt_kunde_id: kontaktResult?.kontakt_kunde_id ?? null,
        kontakt_id: kontaktResult?.kontakt_id ?? null,
      }),
      Promise.resolve(wartungsdatenRef.current?.getValues() ?? null),
    ]);

    if (!anlageResult.success) {
      setIsSaving(false);
      setError(anlageResult.error ?? "Unbekannter Fehler.");
      return;
    }

    // Save wartungsvertrag (update existing or create new)
    if (wData) {
      const vertragResult = wData.vertragId
        ? await updateVertrag(wData.vertragId, { ...wData.data, kunden_id: form.kunden_id ?? null, anl_typ_id: form.anl_typ_id ?? null })
        : await createVertrag({ anlage_id: anlage.id, kunden_id: form.kunden_id ?? null, anl_typ_id: form.anl_typ_id ?? null, ...wData.data });
      if (!vertragResult.success) {
        setIsSaving(false);
        setError(vertragResult.error ?? "Fehler beim Speichern der Wartungsdaten.");
        return;
      }
    }

    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Stammdaten ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stammdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Anlagen-Nr. + Anlagentyp */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="anlagen_nr">Anlagen-Nr.</Label>
                <Input
                  id="anlagen_nr"
                  value={form.anlagen_nr}
                  onChange={(e) => set("anlagen_nr", e.target.value)}
                  placeholder="z. B. AS-290"
                />
              </div>
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
            </div>

            {/* Kunde */}
            <div className="space-y-1.5">
              <Label>Kunde <span className="text-destructive">*</span></Label>
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

            {/* Klassen + Techniker */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="oxygen_demand_class">Sauerstoffbedarfsklasse</Label>
                <Select
                  value={form.oxygen_demand_class || "none"}
                  onValueChange={(v) => set("oxygen_demand_class", v === "none" ? "" : v)}
                >
                  <SelectTrigger id="oxygen_demand_class">
                    <SelectValue placeholder="Klasse auswählen…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Keine —</SelectItem>
                    <SelectItem value="CSB">CSB</SelectItem>
                    <SelectItem value="BSB">BSB</SelectItem>
                    <SelectItem value="SSR">SSR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cleaning_class">Reinigungsklasse</Label>
                <Select
                  value={form.cleaning_class || "none"}
                  onValueChange={(v) => set("cleaning_class", v === "none" ? "" : v)}
                >
                  <SelectTrigger id="cleaning_class">
                    <SelectValue placeholder="Klasse auswählen…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Keine —</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="techniker_id">Techniker</Label>
                <Select
                  value={form.techniker_id ?? "none"}
                  onValueChange={(v) =>
                    set("techniker_id", v === "none" ? null : v)
                  }
                >
                  <SelectTrigger id="techniker_id">
                    <SelectValue placeholder="Techniker auswählen…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Kein Techniker —</SelectItem>
                    {techniker.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Hersteller + Typ */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="hersteller">Hersteller</Label>
                <Input
                  id="hersteller"
                  value={form.hersteller ?? ""}
                  onChange={(e) => set("hersteller", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="typ">Typ</Label>
                <Input
                  id="typ"
                  value={form.typ ?? ""}
                  onChange={(e) => set("typ", e.target.value)}
                />
              </div>
            </div>

            {/* Einleitung in */}
            <div className="space-y-1.5">
              <Label htmlFor="discharged_in">Einleitung in</Label>
              <Select
                value={form.discharged_in || "none"}
                onValueChange={(v) => set("discharged_in", v === "none" ? "" : v)}
              >
                <SelectTrigger id="discharged_in">
                  <SelectValue placeholder="Auswählen…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Keine —</SelectItem>
                  <SelectItem value="Grundwasser">Grundwasser</SelectItem>
                  <SelectItem value="Platzhalter">Platzhalter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Verfahren + Biologien + EW */}
            <div className="grid grid-cols-4 gap-4">
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
              <div className="space-y-1.5">
                <Label htmlFor="number_of_biologies">Anzahl Biologien</Label>
                <Input
                  id="number_of_biologies"
                  type="number"
                  min={0}
                  value={form.number_of_biologies ?? ""}
                  onChange={(e) =>
                    set(
                      "number_of_biologies",
                      e.target.value === "" ? null : parseInt(e.target.value, 10)
                    )
                  }
                />
              </div>
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
            </div>

            {/* Gesamtgröße VK + Größe VK 1–4 */}
            <div className="grid grid-cols-5 gap-4">
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
              {([1, 2, 3, 4] as const).map((n) => {
                const field = `groesse_vk${n}` as "groesse_vk1" | "groesse_vk2" | "groesse_vk3" | "groesse_vk4";
                return (
                  <div key={n} className="space-y-1.5">
                    <Label htmlFor={field}>Größe VK {n}</Label>
                    <Input
                      id={field}
                      type="number"
                      min={0}
                      step="0.01"
                      value={form[field] ?? ""}
                      onChange={(e) =>
                        set(field, e.target.value === "" ? null : parseFloat(e.target.value))
                      }
                    />
                  </div>
                );
              })}
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

            <AnlageLocationMap
              apiKey={mapsApiKey}
              lat={form.breitengrad}
              lng={form.laengengrad}
              address={[
                [form.strasse, form.hausnr].filter(Boolean).join(" "),
                [form.plz, form.ort].filter(Boolean).join(" "),
                form.laenderkennung,
              ].filter(Boolean).join(", ")}
              onCoordsChange={(lat, lng) =>
                setForm((prev) => ({ ...prev, breitengrad: lat, laengengrad: lng }))
              }
              onAddressChange={(addr) =>
                setForm((prev) => ({
                  ...prev,
                  strasse: addr.strasse || prev.strasse,
                  hausnr: addr.hausnr || prev.hausnr,
                  plz: addr.plz || prev.plz,
                  ort: addr.ort || prev.ort,
                  laenderkennung: addr.laenderkennung || prev.laenderkennung,
                  ortsteil: addr.ortsteil || prev.ortsteil,
                }))
              }
            />

          </CardContent>
        </Card>

        {/* ── Wartungsdaten ──────────────────────────────────────── */}
        <WartungsdatenCard ref={wartungsdatenRef} initialVertrag={initialVertrag} />

        {/* ── Ansprechpartner ────────────────────────────────────── */}
        <KontaktSection
          ref={kontaktRef}
          initialMode={initialContactMode}
          initialKundeId={anlage.kontakt_kunde_id}
          initialKundeInfo={initialKundeInfo}
          initialKontakt={initialKontakt}
        />

        {/* ── Anmerkungen ────────────────────────────────────────── */}
        <InternalComments
          refTable="anlagen"
          refId={anlage.id}
          initialComments={initialKommentare}
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
