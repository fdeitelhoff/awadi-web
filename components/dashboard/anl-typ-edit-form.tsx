"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAnlTyp, type UpdateAnlTypInput } from "@/lib/actions/anl-typen";
import type { AnlTypFull } from "@/lib/types/anl-typ";
import { Loader2, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AnlTypEditFormProps {
  typ: AnlTypFull;
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

export function AnlTypEditForm({ typ }: AnlTypEditFormProps) {
  const [form, setForm] = useState<UpdateAnlTypInput>({
    sortiernr: typ.sortiernr ?? undefined,
    bezeichnung: typ.bezeichnung,
    bio_felder: typ.bio_felder ?? "",
    preis_je_wartung: typ.preis_je_wartung,
    preis_je_kontrolle: typ.preis_je_kontrolle,
    wartungsintervall_monate: typ.wartungsintervall_monate,
    dauer_wartung_minuten: typ.dauer_wartung_minuten,
    dauer_kontrolle_minuten: typ.dauer_kontrolle_minuten ?? undefined,
    comment: typ.comment ?? "",
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

            <div className="space-y-1.5">
              <Label htmlFor="bio_felder">Bio-Felder</Label>
              <Input
                id="bio_felder"
                value={form.bio_felder}
                onChange={(e) => setStr("bio_felder", e.target.value)}
                placeholder="|Feld1|Feld2|…"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Pipe-getrennte Liste der Inspektionsfelder für diesen Typ.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comment">Notizen</Label>
              <Textarea
                id="comment"
                rows={4}
                value={form.comment}
                onChange={(e) => setStr("comment", e.target.value)}
              />
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

            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-1.5">
                <Label htmlFor="dauer_kontrolle_minuten">
                  Dauer Kontrolle (Min.)
                </Label>
                <Input
                  id="dauer_kontrolle_minuten"
                  type="number"
                  min={0}
                  value={form.dauer_kontrolle_minuten ?? ""}
                  onChange={(e) =>
                    setNum("dauer_kontrolle_minuten", e.target.value, true)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="preis_je_wartung">Preis je Wartung (€)</Label>
                <Input
                  id="preis_je_wartung"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.preis_je_wartung ?? ""}
                  onChange={(e) => setNum("preis_je_wartung", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="preis_je_kontrolle">
                  Preis je Kontrolle (€)
                </Label>
                <Input
                  id="preis_je_kontrolle"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.preis_je_kontrolle ?? ""}
                  onChange={(e) =>
                    setNum("preis_je_kontrolle", e.target.value)
                  }
                />
              </div>
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
