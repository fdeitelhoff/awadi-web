"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAnlTyp, type UpdateAnlTypInput } from "@/lib/actions/anl-typen";
import type { AnlTypBioFeld, AnlTypFull } from "@/lib/types/anl-typ";
import type { InternalComment } from "@/lib/types/kommentar";
import { InternalComments } from "@/components/dashboard/internal-comments";
import { AnlTypBioFelderCard } from "@/components/dashboard/anl-typ-bio-felder-card";
import { Loader2, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AnlTypEditFormProps {
  typ: AnlTypFull;
  initialKommentare: InternalComment[];
  initialBioFelder: AnlTypBioFeld[];
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

export function AnlTypEditForm({ typ, initialKommentare, initialBioFelder }: AnlTypEditFormProps) {
  const [form, setForm] = useState<UpdateAnlTypInput>({
    sortiernr: typ.sortiernr ?? undefined,
    bezeichnung: typ.bezeichnung,
    wartungsintervall_monate: typ.wartungsintervall_monate,
    dauer_wartung_minuten: typ.dauer_wartung_minuten,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setNum = (field: keyof UpdateAnlTypInput, value: string, nullable = false) => {
    if (value === "") {
      setForm((prev) => ({ ...prev, [field]: nullable ? null : undefined }));
    } else {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        setForm((prev) => ({ ...prev, [field]: parsed }));
      }
    }
  };

  const setStr = (field: keyof UpdateAnlTypInput, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bezeichnung?.trim()) {
      setError("Bitte eine Bezeichnung angeben.");
      return;
    }
    setIsSaving(true);
    setSaved(false);
    setError(null);

    const result = await updateAnlTyp(typ.id, form);

    setIsSaving(false);
    if (!result.success) {
      setError(result.error ?? "Unbekannter Fehler.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const metaInfo = [
    `ID: ${typ.id}`,
    typ.created_at && `Erstellt: ${formatDateTime(typ.created_at)}`,
    typ.last_update && `Geändert: ${formatDateTime(typ.last_update)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href="/settings/facility-types">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Link>
        </Button>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{typ.bezeichnung}</h1>
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

            <div className="grid grid-cols-[100px_1fr] gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sortiernr">Sort-Nr.</Label>
                <Input
                  id="sortiernr"
                  type="number"
                  min={0}
                  value={form.sortiernr ?? ""}
                  onChange={(e) => setNum("sortiernr", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bezeichnung">
                  Bezeichnung <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="bezeichnung"
                  value={form.bezeichnung}
                  onChange={(e) => setStr("bezeichnung", e.target.value)}
                />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ── Wartung & Preise ────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Wartung &amp; Preise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="space-y-1.5">
              <Label htmlFor="wartungsintervall_monate">
                Wartungsintervall (Monate)
              </Label>
              <Input
                id="wartungsintervall_monate"
                type="number"
                min={1}
                value={form.wartungsintervall_monate ?? ""}
                onChange={(e) =>
                  setNum("wartungsintervall_monate", e.target.value)
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dauer_wartung_minuten">
                Dauer Wartung (Min.)
              </Label>
              <Input
                id="dauer_wartung_minuten"
                type="number"
                min={0}
                value={form.dauer_wartung_minuten ?? ""}
                onChange={(e) =>
                  setNum("dauer_wartung_minuten", e.target.value)
                }
              />
            </div>

          </CardContent>
        </Card>

        {/* ── Bio-Felder ────────────────────────────────────────── */}
        <AnlTypBioFelderCard
          anl_typ_id={typ.id}
          initialFelder={initialBioFelder}
        />

        {/* ── Anmerkungen ───────────────────────────────────────── */}
        <InternalComments
          refTable="anl_typen"
          refId={typ.id}
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
