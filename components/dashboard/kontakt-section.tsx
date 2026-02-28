"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KundePicker } from "@/components/dashboard/kunde-picker";
import type { SelectedKunde } from "@/components/dashboard/kunde-picker";
import { createKontakt, updateKontakt } from "@/lib/actions/kontakte";
import type { Kontakt } from "@/lib/types/kontakt";

type ContactMode = "none" | "kunde" | "kontakt";

export interface KontaktSectionRef {
  save: () => Promise<{
    kontakt_kunde_id: number | null;
    kontakt_id: number | null;
    error?: string;
  }>;
}

interface KontaktSectionProps {
  initialMode?: ContactMode;
  initialKundeId?: number;
  initialKundeInfo?: SelectedKunde;
  initialKontakt?: Kontakt;
}

const MODE_LABELS: Record<ContactMode, string> = {
  none: "Kein Ansprechpartner",
  kunde: "Kunde",
  kontakt: "Kontaktdaten",
};

export const KontaktSection = forwardRef<KontaktSectionRef, KontaktSectionProps>(
  function KontaktSection(
    { initialMode = "none", initialKundeId, initialKundeInfo, initialKontakt },
    ref
  ) {
    const [mode, setMode] = useState<ContactMode>(initialMode);
    const [selectedKundeId, setSelectedKundeId] = useState<number | null>(
      initialKundeId ?? null
    );
    const [kontaktForm, setKontaktForm] = useState({
      firma: initialKontakt?.firma ?? "",
      anrede: initialKontakt?.anrede ?? "",
      titel: initialKontakt?.titel ?? "",
      vorname: initialKontakt?.vorname ?? "",
      nachname: initialKontakt?.nachname ?? "",
      strasse: initialKontakt?.strasse ?? "",
      hausnr: initialKontakt?.hausnr ?? "",
      laenderkennung: initialKontakt?.laenderkennung ?? "",
      plz: initialKontakt?.plz ?? "",
      ort: initialKontakt?.ort ?? "",
      ortsteil: initialKontakt?.ortsteil ?? "",
      telefonnr: initialKontakt?.telefonnr ?? "",
      mobilnr: initialKontakt?.mobilnr ?? "",
      email: initialKontakt?.email ?? "",
    });

    useImperativeHandle(ref, () => ({
      save: async () => {
        if (mode === "none") {
          return { kontakt_kunde_id: null, kontakt_id: null };
        }

        if (mode === "kunde") {
          if (!selectedKundeId) {
            return {
              kontakt_kunde_id: null,
              kontakt_id: null,
              error: "Bitte einen Kunden als Ansprechpartner auswählen.",
            };
          }
          return { kontakt_kunde_id: selectedKundeId, kontakt_id: null };
        }

        // mode === "kontakt"
        if (initialKontakt?.id) {
          const result = await updateKontakt(initialKontakt.id, kontaktForm);
          if (!result.success) {
            return {
              kontakt_kunde_id: null,
              kontakt_id: null,
              error: result.error ?? "Fehler beim Speichern des Kontakts.",
            };
          }
          return { kontakt_kunde_id: null, kontakt_id: initialKontakt.id };
        } else {
          const result = await createKontakt(kontaktForm);
          if (!result.success) {
            return {
              kontakt_kunde_id: null,
              kontakt_id: null,
              error: result.error ?? "Fehler beim Erstellen des Kontakts.",
            };
          }
          return { kontakt_kunde_id: null, kontakt_id: result.id! };
        }
      },
    }));

    const setField = (field: string, value: string) =>
      setKontaktForm((prev) => ({ ...prev, [field]: value }));

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ansprechpartner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Mode selector */}
          <div className="flex rounded-md border overflow-hidden text-sm">
            {(Object.keys(MODE_LABELS) as ContactMode[]).map((m, i) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 px-3 py-2 transition-colors ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }${i > 0 ? " border-l" : ""}`}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          {/* No contact */}
          {mode === "none" && (
            <p className="text-sm text-muted-foreground">
              Kein Ansprechpartner für diese Anlage hinterlegt.
            </p>
          )}

          {/* Customer as contact */}
          {mode === "kunde" && (
            <div className="space-y-1.5">
              <Label>Ansprechpartner (Kunde)</Label>
              <KundePicker
                value={selectedKundeId}
                onChange={setSelectedKundeId}
                initial={initialKundeInfo}
              />
            </div>
          )}

          {/* Standalone contact form */}
          {mode === "kontakt" && (
            <div className="space-y-4">

              {/* Firma */}
              <div className="space-y-1.5">
                <Label htmlFor="k_firma">Firma</Label>
                <Input
                  id="k_firma"
                  value={kontaktForm.firma}
                  onChange={(e) => setField("firma", e.target.value)}
                />
              </div>

              {/* Anrede + Name */}
              <div className="grid grid-cols-[80px_1fr_1fr] gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="k_anrede">Anrede</Label>
                  <Input
                    id="k_anrede"
                    value={kontaktForm.anrede}
                    onChange={(e) => setField("anrede", e.target.value)}
                    placeholder="Herr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="k_vorname">Vorname</Label>
                  <Input
                    id="k_vorname"
                    value={kontaktForm.vorname}
                    onChange={(e) => setField("vorname", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="k_nachname">Nachname</Label>
                  <Input
                    id="k_nachname"
                    value={kontaktForm.nachname}
                    onChange={(e) => setField("nachname", e.target.value)}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="grid grid-cols-[1fr_100px] gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="k_strasse">Straße</Label>
                  <Input
                    id="k_strasse"
                    value={kontaktForm.strasse}
                    onChange={(e) => setField("strasse", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="k_hausnr">Nr.</Label>
                  <Input
                    id="k_hausnr"
                    value={kontaktForm.hausnr}
                    onChange={(e) => setField("hausnr", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[90px_1fr] gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="k_plz">PLZ</Label>
                  <Input
                    id="k_plz"
                    value={kontaktForm.plz}
                    onChange={(e) => setField("plz", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="k_ort">Ort</Label>
                  <Input
                    id="k_ort"
                    value={kontaktForm.ort}
                    onChange={(e) => setField("ort", e.target.value)}
                  />
                </div>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="k_telefonnr">Telefon</Label>
                  <Input
                    id="k_telefonnr"
                    type="tel"
                    value={kontaktForm.telefonnr}
                    onChange={(e) => setField("telefonnr", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="k_mobilnr">Mobil</Label>
                  <Input
                    id="k_mobilnr"
                    type="tel"
                    value={kontaktForm.mobilnr}
                    onChange={(e) => setField("mobilnr", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="k_email">E-Mail</Label>
                <Input
                  id="k_email"
                  type="email"
                  value={kontaktForm.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>


            </div>
          )}

        </CardContent>
      </Card>
    );
  }
);
