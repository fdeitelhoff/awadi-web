"use client";

import { useState } from "react";
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
import { createKontakt } from "@/lib/actions/kontakte";
import type { KontaktFormData } from "@/lib/types/kontakt";
import { Loader2, ArrowLeft } from "lucide-react";

const EMPTY_FORM: KontaktFormData = {
  anrede: "",
  titel: "",
  vorname: "",
  nachname: "",
  firma: "",
  strasse: "",
  hausnr: "",
  laenderkennung: "",
  plz: "",
  ort: "",
  ortsteil: "",
  telefonnr: "",
  mobilnr: "",
  email: "",
};

export function KontaktCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState<KontaktFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof KontaktFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nachname?.trim() && !form.firma?.trim()) {
      setError("Bitte Nachname oder Firma angeben.");
      return;
    }
    setIsSaving(true);
    setError(null);

    const result = await createKontakt(form);

    if (!result.success) {
      setIsSaving(false);
      setError(result.error ?? "Unbekannter Fehler.");
      return;
    }

    router.push(`/master-data/contacts/${result.id}`);
  };

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
          <h1 className="text-2xl font-semibold">Neuer Kontakt</h1>
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
