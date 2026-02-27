"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { createAnlage, type CreateAnlageInput } from "@/lib/actions/anlagen";
import type { AnlTyp } from "@/lib/types/anlage";
import { KundePicker } from "@/components/dashboard/kunde-picker";
import {
  KontaktSection,
  type KontaktSectionRef,
} from "@/components/dashboard/kontakt-section";
import { Loader2, ArrowLeft } from "lucide-react";

const EMPTY_FORM: CreateAnlageInput = {
  kunden_id: 0,
  anl_typ_id: undefined,
  anlagen_nr: "",
  bezeichnung: "",
  verfahren_br_anz_behaelter: undefined,
  strasse: "",
  hausnr: "",
  laenderkennung: "",
  plz: "",
  ort: "",
  ortsteil: "",
  gemarkung: "",
  flur: "",
  flurstueck: "",
  rechtswert: "",
  hochwert: "",
  breitengrad: "",
  laengengrad: "",
  anlage_ausgelegt_ew: undefined,
  tatsaechliche_ew: undefined,
  gesamtgroesse_vk: undefined,


  comment: "",
  anmerkungen_gesamt: "",
  cleaning_class: "",
  oxygen_demand_class: "",
  discharged_in: "",
  number_of_biologies: undefined,
};

interface AnlageCreateFormProps {
  anlTypen: AnlTyp[];
}

export function AnlageCreateForm({ anlTypen }: AnlageCreateFormProps) {
  const router = useRouter();
  const kontaktRef = useRef<KontaktSectionRef>(null);
  const [form, setForm] = useState<CreateAnlageInput>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (
    field: keyof CreateAnlageInput,
    value: string | boolean | number | undefined
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.anlagen_nr?.trim()) {
      setError("Bitte eine Anlagen-Nr. angeben.");
      return;
    }
    if (!form.kunden_id || form.kunden_id <= 0) {
      setError("Bitte einen Eigentümer auswählen.");
      return;
    }
    setIsSaving(true);
    setError(null);

    // Save contact person first (may create a kontakte record)
    const kontaktResult = await kontaktRef.current?.save();
    if (kontaktResult?.error) {
      setError(kontaktResult.error);
      setIsSaving(false);
      return;
    }

    const result = await createAnlage({
      ...form,
      kontakt_kunde_id: kontaktResult?.kontakt_kunde_id ?? undefined,
      kontakt_id: kontaktResult?.kontakt_id ?? undefined,
    });

    if (!result.success) {
      setIsSaving(false);
      setError(result.error ?? "Unbekannter Fehler.");
      return;
    }

    router.push(`/master-data/facilities/${result.id}`);
  };

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
          <h1 className="text-2xl font-semibold">Neue Anlage</h1>
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

            <div className="space-y-1.5">
              <Label htmlFor="anlagen_nr">
                Anlagen-Nr. <span className="text-destructive">*</span>
              </Label>
              <Input
                id="anlagen_nr"
                value={form.anlagen_nr}
                onChange={(e) => set("anlagen_nr", e.target.value)}
                placeholder="z. B. AS-290"
              />
            </div>

            {/* Anlagentyp + Klassen */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="anl_typ_id">Anlagentyp</Label>
                <Select
                  value={form.anl_typ_id != null ? String(form.anl_typ_id) : "none"}
                  onValueChange={(v) =>
                    set("anl_typ_id", v === "none" ? undefined : parseInt(v, 10))
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

            <div className="space-y-1.5">
              <Label>Eigentümer <span className="text-destructive">*</span></Label>
              <KundePicker
                value={form.kunden_id || null}
                onChange={(id) => set("kunden_id", id ?? 0)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bezeichnung">Bezeichnung</Label>
              <Input
                id="bezeichnung"
                value={form.bezeichnung}
                onChange={(e) => set("bezeichnung", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                      e.target.value === "" ? undefined : parseInt(e.target.value, 10)
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
                      e.target.value === "" ? undefined : parseInt(e.target.value, 10)
                    )
                  }
                />
              </div>
            </div>

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
                      e.target.value === "" ? undefined : parseInt(e.target.value, 10)
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
                      e.target.value === "" ? undefined : parseInt(e.target.value, 10)
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
                      e.target.value === "" ? undefined : parseFloat(e.target.value)
                    )
                  }
                />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ── Anlagenstandort ─────────────────────────────────────── */}
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

          </CardContent>
        </Card>

        {/* ── Anmerkungen ────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anmerkungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

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
        <KontaktSection ref={kontaktRef} />

      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-8">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && <span />}
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Speichern
        </Button>
      </div>
    </form>
  );
}
