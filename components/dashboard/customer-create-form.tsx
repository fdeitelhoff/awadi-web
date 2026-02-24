"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createKunde, type CreateKundeInput } from "@/lib/actions/customers";
import { Loader2, ArrowLeft } from "lucide-react";

const EMPTY_FORM: CreateKundeInput = {
  kundennr: "",
  ist_kunde: true,
  anrede: "",
  titel: "",
  vorname: "",
  nachname: "",
  firma: "",
  bezeichnung: "",
  strasse: "",
  hausnr: "",
  laenderkennung: "",
  plz: "",
  ort: "",
  ortsteil: "",
  telefonnr: "",
  telefonnr_geschaeft: "",
  mobilnr: "",
  mobilnr2: "",
  faxnr: "",
  email: "",
  homepage: "",
  comment: "",
  interne_anmerkungen: "",
};

export function CustomerCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState<CreateKundeInput>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof CreateKundeInput, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nachname?.trim() && !form.firma?.trim()) {
      setError("Bitte Nachname oder Firma angeben.");
      return;
    }
    setIsSaving(true);
    setError(null);

    const result = await createKunde(form);

    if (!result.success) {
      setIsSaving(false);
      setError(result.error ?? "Unbekannter Fehler.");
      return;
    }

    router.push(`/master-data/customers/${result.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href="/master-data/customers">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Link>
        </Button>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Neuer Kunde</h1>
          <Button type="submit" disabled={isSaving} className="shrink-0">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </div>
      </div>

      {/* ── 2-column grid: row 1 = Stammdaten | Adresse
                          row 2 = Kontakt    | Anmerkungen ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Stammdaten ───────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stammdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="kundennr">Kunden-Nr.</Label>
                <Input
                  id="kundennr"
                  value={form.kundennr}
                  onChange={(e) => set("kundennr", e.target.value)}
                  placeholder="z. B. AS-001"
                />
              </div>
              <div className="flex items-end pb-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="ist_kunde"
                    checked={form.ist_kunde}
                    onCheckedChange={(checked) => set("ist_kunde", !!checked)}
                  />
                  <Label htmlFor="ist_kunde">Ist Kunde</Label>
                </div>
              </div>
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firma">Firma</Label>
                <Input
                  id="firma"
                  value={form.firma}
                  onChange={(e) => set("firma", e.target.value)}
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
                <Label htmlFor="telefonnr_geschaeft">Telefon (Geschäft)</Label>
                <Input
                  id="telefonnr_geschaeft"
                  type="tel"
                  value={form.telefonnr_geschaeft}
                  onChange={(e) => set("telefonnr_geschaeft", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="mobilnr">Mobil</Label>
                <Input
                  id="mobilnr"
                  type="tel"
                  value={form.mobilnr}
                  onChange={(e) => set("mobilnr", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mobilnr2">Mobil 2</Label>
                <Input
                  id="mobilnr2"
                  type="tel"
                  value={form.mobilnr2}
                  onChange={(e) => set("mobilnr2", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="faxnr">Fax</Label>
                <Input
                  id="faxnr"
                  type="tel"
                  value={form.faxnr}
                  onChange={(e) => set("faxnr", e.target.value)}
                />
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="homepage">Homepage</Label>
              <Input
                id="homepage"
                type="url"
                value={form.homepage}
                onChange={(e) => set("homepage", e.target.value)}
                placeholder="https://"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Anmerkungen ──────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anmerkungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="comment">Kommentar</Label>
              <Textarea
                id="comment"
                rows={4}
                value={form.comment}
                onChange={(e) => set("comment", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="interne_anmerkungen">Interne Anmerkungen</Label>
              <Textarea
                id="interne_anmerkungen"
                rows={4}
                value={form.interne_anmerkungen}
                onChange={(e) => set("interne_anmerkungen", e.target.value)}
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
