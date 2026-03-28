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
import {
  createVertrag,
  type CreateVertragInput,
} from "@/lib/actions/vertraege";
import type { AnlTyp } from "@/lib/types/anlage";
import { AnlagePicker } from "@/components/dashboard/anlage-picker";
import { KundePicker } from "@/components/dashboard/kunde-picker";
import { Loader2, ArrowLeft } from "lucide-react";

const EMPTY_FORM: CreateVertragInput = {
  anlage_id: 0,
  kunden_id: null,
  gueltig_ab: "",
  gueltig_bis: "",
  anl_typ_id: null,
  intervall_monate: undefined,
  dauer_wartung_minuten: undefined,
  datum_naechste_wartung: "",
  datum_letzte_wartung: "",
};

interface VertragCreateFormProps {
  anlTypen: AnlTyp[];
}

export function VertragCreateForm({ anlTypen }: VertragCreateFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<CreateVertragInput>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CreateVertragInput>(
    field: K,
    value: CreateVertragInput[K]
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.anlage_id || form.anlage_id <= 0) {
      setError("Bitte eine Anlage auswählen.");
      return;
    }
    setIsSaving(true);
    setError(null);

    const result = await createVertrag(form);

    if (!result.success) {
      setIsSaving(false);
      setError(result.error ?? "Unbekannter Fehler.");
      return;
    }

    router.push(`/master-data/maintenance/${result.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href="/master-data/maintenance">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Link>
        </Button>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Neue Wartungsdaten</h1>
          <Button type="submit" disabled={isSaving} className="shrink-0">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Wartungsdaten ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Wartungsdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>
                  Anlage <span className="text-destructive">*</span>
                </Label>
                <AnlagePicker
                  value={form.anlage_id || null}
                  onChange={(id) => set("anlage_id", id ?? 0)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kunde</Label>
                <KundePicker
                  value={form.kunden_id ?? null}
                  onChange={(id) => set("kunden_id", id)}
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

            <div className="grid grid-cols-4 gap-4">
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
                        ? undefined
                        : parseInt(e.target.value, 10)
                    )
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dauer_wartung_minuten">Dauer (Minuten)</Label>
                <Input
                  id="dauer_wartung_minuten"
                  type="number"
                  min={1}
                  value={form.dauer_wartung_minuten ?? ""}
                  onChange={(e) =>
                    set(
                      "dauer_wartung_minuten",
                      e.target.value === ""
                        ? undefined
                        : parseInt(e.target.value, 10)
                    )
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="datum_letzte_wartung">Letzte Wartung</Label>
                <Input
                  id="datum_letzte_wartung"
                  type="date"
                  value={form.datum_letzte_wartung}
                  onChange={(e) => set("datum_letzte_wartung", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="datum_naechste_wartung">Nächste Wartung</Label>
                <Input
                  id="datum_naechste_wartung"
                  type="date"
                  value={form.datum_naechste_wartung}
                  onChange={(e) => set("datum_naechste_wartung", e.target.value)}
                />
              </div>
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
