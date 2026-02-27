"use client";

import { useState } from "react";
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
import { updateKontakt } from "@/lib/actions/kontakte";
import type { Kontakt, KontaktFormData } from "@/lib/types/kontakt";
import { Loader2, Check, ArrowLeft } from "lucide-react";

interface KontaktEditFormProps {
  kontakt: Kontakt;
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

export function KontaktEditForm({ kontakt }: KontaktEditFormProps) {
  const [form, setForm] = useState<KontaktFormData>({
    anrede: kontakt.anrede ?? "",
    titel: kontakt.titel ?? "",
    vorname: kontakt.vorname ?? "",
    nachname: kontakt.nachname ?? "",
    firma: kontakt.firma ?? "",
    strasse: kontakt.strasse ?? "",
    hausnr: kontakt.hausnr ?? "",
    laenderkennung: kontakt.laenderkennung ?? "",
    plz: kontakt.plz ?? "",
    ort: kontakt.ort ?? "",
    ortsteil: kontakt.ortsteil ?? "",
    telefonnr: kontakt.telefonnr ?? "",
    mobilnr: kontakt.mobilnr ?? "",
    email: kontakt.email ?? "",
    anmerkungen: kontakt.anmerkungen ?? "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof KontaktFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    setError(null);

    const result = await updateKontakt(kontakt.id, form);

    setIsSaving(false);
    if (!result.success) {
      setError(result.error ?? "Unbekannter Fehler.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const namePart =
    kontakt.firma ||
    [kontakt.vorname, kontakt.nachname].filter(Boolean).join(" ") ||
    "Kontakt";

  const metaInfo = [
    kontakt.created_at && `Erstellt: ${formatDateTime(kontakt.created_at)}`,
    kontakt.last_update && `Geändert: ${formatDateTime(kontakt.last_update)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href="/master-data/contacts">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Link>
        </Button>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Kontakt: {namePart}</h1>
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

      {/* ── 2-column grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Stammdaten ───────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stammdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="anrede">Anrede</Label>
                <Select
                  value={form.anrede}
                  onValueChange={(v) => set("anrede", v)}
                >
                  <SelectTrigger id="anrede">
                    <SelectValue placeholder="Auswählen…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Herr">Herr</SelectItem>
                    <SelectItem value="Frau">Frau</SelectItem>
                    <SelectItem value="Divers">Divers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="titel">Titel</Label>
                <Input
                  id="titel"
                  value={form.titel}
                  onChange={(e) => set("titel", e.target.value)}
                  placeholder="z. B. Dr."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="vorname">Vorname</Label>
                <Input
                  id="vorname"
                  value={form.vorname}
                  onChange={(e) => set("vorname", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nachname">Nachname</Label>
                <Input
                  id="nachname"
                  value={form.nachname}
                  onChange={(e) => set("nachname", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="firma">Firma</Label>
              <Input
                id="firma"
                value={form.firma}
                onChange={(e) => set("firma", e.target.value)}
              />
            </div>

          </CardContent>
        </Card>

        {/* ── Adresse ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adresse</CardTitle>
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

          </CardContent>
        </Card>

        {/* ── Kontakt ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kontakt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="telefonnr">Telefon</Label>
                <Input
                  id="telefonnr"
                  type="tel"
                  value={form.telefonnr}
                  onChange={(e) => set("telefonnr", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mobilnr">Mobil</Label>
                <Input
                  id="mobilnr"
                  type="tel"
                  value={form.mobilnr}
                  onChange={(e) => set("mobilnr", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>

          </CardContent>
        </Card>

        {/* ── Anmerkungen ──────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anmerkungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="anmerkungen">Anmerkungen</Label>
              <Textarea
                id="anmerkungen"
                rows={6}
                value={form.anmerkungen}
                onChange={(e) => set("anmerkungen", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

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
