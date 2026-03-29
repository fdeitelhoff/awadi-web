"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Vertrag } from "@/lib/types/vertrag";

export interface WartungsdatenInput {
  datum_naechste_wartung?: string;
  datum_letzte_wartung?: string;
  intervall_monate?: number;
  dauer_wartung_minuten?: number;
  gueltig_ab?: string;
  gueltig_bis?: string;
}

export interface WartungsdatenCardRef {
  /**
   * Returns the current values.
   * - null  → no existing vertrag and all fields empty (nothing to save)
   * - non-null → caller should updateVertrag(vertragId, data) or createVertrag({ anlage_id, ...data })
   */
  getValues(): { vertragId?: number; data: WartungsdatenInput } | null;
  /** Merges the given values into the form state (used for auto-fill). */
  setValues(values: Partial<WartungsdatenInput>): void;
}

interface WartungsdatenCardProps {
  initialVertrag?: Vertrag | null;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export const WartungsdatenCard = forwardRef<WartungsdatenCardRef, WartungsdatenCardProps>(
  function WartungsdatenCard({ initialVertrag }, ref) {
    const [form, setForm] = useState<WartungsdatenInput>({
      datum_naechste_wartung: initialVertrag?.datum_naechste_wartung ?? "",
      datum_letzte_wartung: initialVertrag?.datum_letzte_wartung ?? "",
      intervall_monate: initialVertrag?.intervall_monate,
      dauer_wartung_minuten: initialVertrag?.dauer_wartung_minuten,
      gueltig_ab: initialVertrag?.gueltig_ab ?? "",
      gueltig_bis: initialVertrag?.gueltig_bis ?? "",
    });

    useImperativeHandle(ref, () => ({
      setValues(values: Partial<WartungsdatenInput>) {
        setForm((prev) => ({ ...prev, ...values }));
      },
      getValues() {
        // When editing an existing vertrag always return values (so we can update it).
        // When creating, only return if at least one field is filled.
        const hasData =
          (form.datum_naechste_wartung ?? "").trim() ||
          (form.datum_letzte_wartung ?? "").trim() ||
          form.intervall_monate != null ||
          form.dauer_wartung_minuten != null ||
          (form.gueltig_ab ?? "").trim() ||
          (form.gueltig_bis ?? "").trim();

        if (!initialVertrag && !hasData) return null;

        return {
          vertragId: initialVertrag?.id,
          data: {
            datum_naechste_wartung: (form.datum_naechste_wartung ?? "").trim() || undefined,
            datum_letzte_wartung: (form.datum_letzte_wartung ?? "").trim() || undefined,
            intervall_monate: form.intervall_monate,
            dauer_wartung_minuten: form.dauer_wartung_minuten,
            gueltig_ab: (form.gueltig_ab ?? "").trim() || undefined,
            gueltig_bis: (form.gueltig_bis ?? "").trim() || undefined,
          },
        };
      },
    }));

    const set = <K extends keyof WartungsdatenInput>(field: K, value: WartungsdatenInput[K]) =>
      setForm((prev) => ({ ...prev, [field]: value }));

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wartungsdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Nächste Wartung */}
          <div className="space-y-1.5">
            <Label htmlFor="datum_naechste_wartung">Nächste Wartung</Label>
            <Input
              id="datum_naechste_wartung"
              type="date"
              value={form.datum_naechste_wartung ?? ""}
              onChange={(e) => set("datum_naechste_wartung", e.target.value)}
            />
          </div>

          {/* Letzte Wartung */}
          <div className="space-y-1.5">
            <Label htmlFor="datum_letzte_wartung">Letzte Wartung</Label>
            <Input
              id="datum_letzte_wartung"
              type="date"
              value={form.datum_letzte_wartung ?? ""}
              onChange={(e) => set("datum_letzte_wartung", e.target.value)}
            />
          </div>

          {/* Intervall + Dauer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="intervall_monate">Intervall (Monate)</Label>
              <Input
                id="intervall_monate"
                type="number"
                min={1}
                value={form.intervall_monate ?? ""}
                onChange={(e) =>
                  set("intervall_monate", e.target.value === "" ? undefined : parseInt(e.target.value, 10))
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
                  set("dauer_wartung_minuten", e.target.value === "" ? undefined : parseInt(e.target.value, 10))
                }
              />
            </div>
          </div>

          {/* Gültig ab + bis */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="gueltig_ab">Gültig ab</Label>
              <Input
                id="gueltig_ab"
                type="date"
                value={form.gueltig_ab ?? ""}
                onChange={(e) => set("gueltig_ab", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gueltig_bis">Gültig bis</Label>
              <Input
                id="gueltig_bis"
                type="date"
                value={form.gueltig_bis ?? ""}
                onChange={(e) => set("gueltig_bis", e.target.value)}
              />
            </div>
          </div>

          {/* Metadata when editing */}
          {initialVertrag && (
            <p className="text-xs text-muted-foreground">
              Vertrag #{initialVertrag.id}
              {initialVertrag.last_update &&
                ` · Geändert: ${formatDate(initialVertrag.last_update)}`}
            </p>
          )}

        </CardContent>
      </Card>
    );
  }
);
