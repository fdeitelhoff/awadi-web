"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { createKunde, type CreateKundeInput } from "@/lib/actions/customers";
import { UnsavedChangesDialog } from "@/components/dashboard/unsaved-changes-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft } from "lucide-react";

const EMPTY_FORM: CreateKundeInput = {
  kundennr: "",
  ist_kunde: true,
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
  telefonnr_geschaeft: "",
  mobilnr: "",
  mobilnr2: "",
  email: "",
  email_secondary: "",
  homepage: "",
};

export function CustomerCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState<CreateKundeInput>(EMPTY_FORM);
  const [initialValues] = useState<CreateKundeInput>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateKundeInput, string>>>({});

  const clearError = (field: keyof CreateKundeInput) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialValues);

  const set = (field: keyof CreateKundeInput, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const validate = (): boolean => {
    const next: Partial<Record<keyof CreateKundeInput, string>> = {};
    if (!form.nachname?.trim() && !form.firma?.trim()) {
      next.nachname = "Nachname oder Firma ist erforderlich.";
      next.firma = "Nachname oder Firma ist erforderlich.";
    }
    if (form.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Bitte eine gültige E-Mail-Adresse eingeben.";
    }
    if (form.email_secondary?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_secondary.trim())) {
      next.email_secondary = "Bitte eine gültige E-Mail-Adresse eingeben.";
    }
    if (form.homepage?.trim() && !/^https?:\/\/.+\..+/.test(form.homepage.trim())) {
      next.homepage = "Bitte eine gültige URL eingeben (z. B. https://example.de).";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const performSave = async (): Promise<{ success: boolean; id?: number }> => {
    if (isSaving) return { success: false };
    if (!validate()) return { success: false };
    setIsSaving(true);
    const result = await createKunde(form);
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error ?? "Unbekannter Fehler.");
      return { success: false };
    }
    return { success: true, id: result.id };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await performSave();
    if (result.success && result.id) {
      toast.success("Kunde angelegt");
      router.push(`/master-data/customers/${result.id}`);
    }
  };

  const handleLeave = () => {
    setForm(EMPTY_FORM);
    setIsDialogOpen(false);
    router.push("/master-data/customers");
  };

  const handleBackClick = () => {
    if (isDirty) {
      setIsDialogOpen(true);
    } else {
      router.push("/master-data/customers");
    }
  };

  const handleSaveAndLeave = async () => {
    const result = await performSave();
    if (result.success) {
      toast.success("Kunde angelegt");
      setIsDialogOpen(false);
      router.push("/master-data/customers");
    } else {
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <UnsavedChangesDialog
        open={isDialogOpen}
        isSaving={isSaving}
        onStay={() => setIsDialogOpen(false)}
        onSaveAndLeave={handleSaveAndLeave}
        onLeave={handleLeave}
      />

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>

        {/* ── Page header ──────────────────────────────────────────── */}
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 mb-2"
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
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

              <div className="grid grid-cols-[auto_1fr] gap-4 items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="ist_kunde">Ist Kunde</Label>
                  <div className="h-9 flex items-center">
                    <Checkbox
                      id="ist_kunde"
                      checked={form.ist_kunde ?? true}
                      onCheckedChange={(v) => set("ist_kunde", !!v)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kundennr">Kunden-Nr.</Label>
                  <Input
                    id="kundennr"
                    value={form.kundennr}
                    onChange={(e) => set("kundennr", e.target.value)}
                    placeholder="z. B. AS-001"
                  />
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
                  <Label htmlFor="nachname">
                    Nachname <span className="text-destructive" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="nachname"
                    value={form.nachname}
                    aria-required={true}
                    aria-invalid={!!errors.nachname}
                    onChange={(e) => {
                      set("nachname", e.target.value);
                      if (errors.nachname) clearError("nachname");
                    }}
                    className={errors.nachname ? "border-destructive" : ""}
                  />
                  {errors.nachname && (
                    <p className="text-sm text-destructive mt-1">{errors.nachname}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="firma">
                  Firma <span className="text-destructive" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="firma"
                  value={form.firma}
                  aria-invalid={!!errors.firma}
                  onChange={(e) => {
                    set("firma", e.target.value);
                    if (errors.firma) clearError("firma");
                  }}
                  className={errors.firma ? "border-destructive" : ""}
                />
                {errors.firma && (
                  <p className="text-sm text-destructive mt-1">{errors.firma}</p>
                )}
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
                  <Label htmlFor="telefonnr_geschaeft">Telefon (geschäftlich)</Label>
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
                  <Label htmlFor="mobilnr2">Mobil (geschäftlich)</Label>
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
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    aria-invalid={!!errors.email}
                    onChange={(e) => {
                      set("email", e.target.value);
                      if (errors.email) clearError("email");
                    }}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email_secondary">E-Mail (geschäftlich)</Label>
                  <Input
                    id="email_secondary"
                    type="email"
                    value={form.email_secondary}
                    aria-invalid={!!errors.email_secondary}
                    onChange={(e) => {
                      set("email_secondary", e.target.value);
                      if (errors.email_secondary) clearError("email_secondary");
                    }}
                    className={errors.email_secondary ? "border-destructive" : ""}
                  />
                  {errors.email_secondary && (
                    <p className="text-sm text-destructive mt-1">{errors.email_secondary}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="homepage">Homepage</Label>
                <Input
                  id="homepage"
                  type="url"
                  value={form.homepage}
                  aria-invalid={!!errors.homepage}
                  onChange={(e) => {
                    set("homepage", e.target.value);
                    if (errors.homepage) clearError("homepage");
                  }}
                  className={errors.homepage ? "border-destructive" : ""}
                  placeholder="https://"
                />
                {errors.homepage && (
                  <p className="text-sm text-destructive mt-1">{errors.homepage}</p>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div className="flex justify-end pb-8">
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </div>
      </form>
    </>
  );
}
