"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAnlTyp, createBioFeld, type CreateAnlTypInput } from "@/lib/actions/anl-typen";
import type { DraftBioFeld } from "@/components/dashboard/anl-typ-bio-felder-card";
import { AnlTypBioFelderCard } from "@/components/dashboard/anl-typ-bio-felder-card";
import { Loader2, ArrowLeft } from "lucide-react";

const EMPTY_FORM: CreateAnlTypInput = {
  sortiernr: undefined,
  bezeichnung: "",
  wartungsintervall_monate: 12,
  dauer_wartung_minuten: 60,
};

export function AnlTypCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState<CreateAnlTypInput>(EMPTY_FORM);
  const [pendingBioFelder, setPendingBioFelder] = useState<DraftBioFeld[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setNum = (field: keyof CreateAnlTypInput, value: string) => {
    if (value === "") {
      setForm((prev) => ({ ...prev, [field]: undefined }));
    } else {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        setForm((prev) => ({ ...prev, [field]: parsed }));
      }
    }
  };

  const setStr = (field: keyof CreateAnlTypInput, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleDraftChange = useCallback((felder: DraftBioFeld[]) => {
    setPendingBioFelder(felder);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bezeichnung?.trim()) {
      setError("Bitte eine Bezeichnung angeben.");
      return;
    }
    setIsSaving(true);
    setError(null);

    const result = await createAnlTyp(form);

    if (!result.success || !result.id) {
      setIsSaving(false);
      setError(result.error ?? "Unbekannter Fehler.");
      return;
    }

    // Persist any pending bio fields
    for (const feld of pendingBioFelder) {
      await createBioFeld(result.id, feld.bio_key, feld.bio_name ?? undefined);
    }

    router.push(`/settings/facility-types/${result.id}`);
  };

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
          <h1 className="text-2xl font-semibold">Neuer Anlagentyp</h1>
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
                  autoFocus
                />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ── Wartung & Preise ────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Wartung</CardTitle>
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
                onChange={(e) => setNum("wartungsintervall_monate", e.target.value)}
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
                onChange={(e) => setNum("dauer_wartung_minuten", e.target.value)}
              />
            </div>

          </CardContent>
        </Card>

        {/* ── Bio-Felder ────────────────────────────────────────── */}
        <AnlTypBioFelderCard draft onDraftChange={handleDraftChange} />

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
