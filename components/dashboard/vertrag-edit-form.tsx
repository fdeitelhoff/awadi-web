"use client";

import { useState } from "react";
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
import {
  updateVertrag,
  type UpdateVertragInput,
} from "@/lib/actions/vertraege";
import type { Vertrag } from "@/lib/types/vertrag";
import type { AnlTyp } from "@/lib/types/anlage";
import {
  AnlagePicker,
  type SelectedAnlage,
} from "@/components/dashboard/anlage-picker";
import {
  KundePicker,
  type SelectedKunde,
} from "@/components/dashboard/kunde-picker";
import { Loader2, Check, ArrowLeft } from "lucide-react";

interface VertragEditFormProps {
  vertrag: Vertrag;
  anlTypen: AnlTyp[];
  initialAnlage?: SelectedAnlage;
  initialKunde?: SelectedKunde;
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

export function VertragEditForm({
  vertrag,
  anlTypen,
  initialAnlage,
  initialKunde,
}: VertragEditFormProps) {
  const [form, setForm] = useState<UpdateVertragInput>({
    anlage_id: vertrag.anlage_id,
    kunden_id: vertrag.kunden_id ?? null,
    vertragsnummer: vertrag.vertragsnummer ?? "",
    vertragsdatum: vertrag.vertragsdatum ?? "",
    gueltig_ab: vertrag.gueltig_ab ?? "",
    gueltig_bis: vertrag.gueltig_bis ?? "",
    anl_typ_id: vertrag.anl_typ_id ?? null,
    intervall_monate: vertrag.intervall_monate ?? undefined,
    dauer_wartung_minuten: vertrag.dauer_wartung_minuten ?? undefined,
    preis_je_wartung: vertrag.preis_je_wartung ?? undefined,
    aktiv: vertrag.aktiv,
    comment: vertrag.comment ?? "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof UpdateVertragInput>(
    field: K,
    value: UpdateVertragInput[K]
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    setError(null);

    const result = await updateVertrag(vertrag.id, form);

    setIsSaving(false);
    if (!result.success) {
      setError(result.error ?? "Unbekannter Fehler.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const metaInfo = [
    vertrag.vertragsnummer && `Vertragsnr.: ${vertrag.vertragsnummer}`,
    vertrag.created_at && `Erstellt: ${formatDateTime(vertrag.created_at)}`,
    vertrag.last_update && `Geändert: ${formatDateTime(vertrag.last_update)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const displayName =
    vertrag.vertragsnummer
      ? `Wartungsvertrag: ${vertrag.vertragsnummer}`
      : `Wartungsvertrag #${vertrag.id}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href="/master-data/contracts">
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

        {/* ── Vertragsdaten ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vertragsdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="vertragsnummer">Vertragsnr.</Label>
                <Input
                  id="vertragsnummer"
                  value={form.vertragsnummer}
                  onChange={(e) => set("vertragsnummer", e.target.value)}
                  placeholder="z. B. WV-001"
                />
              </div>
              <div className="flex items-end pb-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="aktiv"
                    checked={form.aktiv}
                    onCheckedChange={(checked) => set("aktiv", !!checked)}
                  />
                  <Label htmlFor="aktiv">Aktiv</Label>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vertragsdatum">Vertragsdatum</Label>
              <Input
                id="vertragsdatum"
                type="date"
                value={form.vertragsdatum}
                onChange={(e) => set("vertragsdatum", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="gueltig_ab">Gültig ab</Label>
                <Input
                  id="gueltig_ab"
                  type="date"
                  value={form.gueltig_ab}
                  onChange={(e) => set("gueltig_ab", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gueltig_bis">Gültig bis</Label>
                <Input
                  id="gueltig_bis"
                  type="date"
                  value={form.gueltig_bis}
                  onChange={(e) => set("gueltig_bis", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="intervall_monate">Intervall (Monate)</Label>
              <Input
                id="intervall_monate"
                type="number"
                min={1}
                value={form.intervall_monate ?? ""}
                onChange={(e) =>
                  set(
                    "intervall_monate",
                    e.target.value === ""
                      ? null
                      : parseInt(e.target.value, 10)
                  )
                }
              />
            </div>

          </CardContent>
        </Card>

        {/* ── Zuordnung ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zuordnung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="space-y-1.5">
              <Label>
                Anlage <span className="text-destructive">*</span>
              </Label>
              <AnlagePicker
                value={form.anlage_id ?? null}
                onChange={(id) => set("anlage_id", id ?? 0)}
                initial={initialAnlage}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Kunde</Label>
              <KundePicker
                value={form.kunden_id ?? null}
                onChange={(id) => set("kunden_id", id)}
                initial={initialKunde}
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

          </CardContent>
        </Card>

        {/* ── Details ───────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dauer_wartung_minuten">Dauer Wartung (Min.)</Label>
                <Input
                  id="dauer_wartung_minuten"
                  type="number"
                  min={0}
                  value={form.dauer_wartung_minuten ?? ""}
                  onChange={(e) =>
                    set(
                      "dauer_wartung_minuten",
                      e.target.value === ""
                        ? null
                        : parseInt(e.target.value, 10)
                    )
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="preis_je_wartung">Preis je Wartung (€)</Label>
                <Input
                  id="preis_je_wartung"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.preis_je_wartung ?? ""}
                  onChange={(e) =>
                    set(
                      "preis_je_wartung",
                      e.target.value === ""
                        ? null
                        : parseFloat(e.target.value)
                    )
                  }
                />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ── Anmerkungen ───────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anmerkungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="comment">Kommentar</Label>
              <Textarea
                id="comment"
                rows={6}
                value={form.comment}
                onChange={(e) => set("comment", e.target.value)}
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
