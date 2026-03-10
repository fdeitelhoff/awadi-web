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
import { updateKunde, type UpdateKundeInput } from "@/lib/actions/customers";
import type { Kunde } from "@/lib/types/customer";
import type { InternalComment } from "@/lib/types/kommentar";
import { InternalComments } from "@/components/dashboard/internal-comments";
import { UnsavedChangesDialog } from "@/components/dashboard/unsaved-changes-dialog";
import { Loader2, ArrowLeft } from "lucide-react";
import { VertragPicker } from "@/components/dashboard/vertrag-picker";

interface CustomerEditFormProps {
  kunde: Kunde;
  initialKommentare: InternalComment[];
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

function makeSnapshot(kunde: Kunde): UpdateKundeInput {
  return {
    kundennr: kunde.kundennr ?? "",
    anrede: kunde.anrede ?? "",
    titel: kunde.titel ?? "",
    vorname: kunde.vorname ?? "",
    nachname: kunde.nachname ?? "",
    firma: kunde.firma ?? "",
    strasse: kunde.strasse ?? "",
    hausnr: kunde.hausnr ?? "",
    laenderkennung: kunde.laenderkennung ?? "",
    plz: kunde.plz ?? "",
    ort: kunde.ort ?? "",
    ortsteil: kunde.ortsteil ?? "",
    telefonnr: kunde.telefonnr ?? "",
    telefonnr_geschaeft: kunde.telefonnr_geschaeft ?? "",
    mobilnr: kunde.mobilnr ?? "",
    mobilnr2: kunde.mobilnr2 ?? "",
    email: kunde.email ?? "",
    email_secondary: kunde.email_secondary ?? "",
    homepage: kunde.homepage ?? "",
  };
}

export function CustomerEditForm({ kunde, initialKommentare }: CustomerEditFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<UpdateKundeInput>(() => makeSnapshot(kunde));
  const [initialValues, setInitialValues] = useState<UpdateKundeInput>(() => makeSnapshot(kunde));
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialValues);

  const set = (field: keyof UpdateKundeInput, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const performSave = async (): Promise<boolean> => {
    if (isSaving) return false;
    setIsSaving(true);
    const result = await updateKunde(kunde.id, form);
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error ?? "Unbekannter Fehler.");
      return false;
    }
    setInitialValues({ ...form });
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await performSave();
    if (ok) toast.success("Gespeichert");
  };

  const handleLeave = () => {
    const snapshot = makeSnapshot(kunde);
    setForm(snapshot);
    setInitialValues(snapshot);
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
    const ok = await performSave();
    if (ok) {
      toast.success("Gespeichert");
      setIsDialogOpen(false);
      router.push("/master-data/customers");
    } else {
      setIsDialogOpen(false);
    }
  };

  const namePart =
    kunde.firma ||
    [kunde.vorname, kunde.nachname].filter(Boolean).join(" ") ||
    "Kunde";

  const displayName = `Kunde: ${namePart}`;

  const metaInfo = [
    kunde.kundennr && `Kunden-Nr.: ${kunde.kundennr}`,
    kunde.created_at && `Erstellt: ${formatDateTime(kunde.created_at)}`,
    kunde.last_update && `Geändert: ${formatDateTime(kunde.last_update)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <UnsavedChangesDialog
        open={isDialogOpen}
        isSaving={isSaving}
        onStay={() => setIsDialogOpen(false)}
        onSaveAndLeave={handleSaveAndLeave}
        onLeave={handleLeave}
      />

      <form onSubmit={handleSubmit} className="space-y-6">

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

        {/* ── 2-column grid: row 1 = Stammdaten | Adresse
                            row 2 = Kontakt    | Anmerkungen ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Stammdaten ───────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stammdaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Kunden-Nr. + Wartungsdaten */}
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
                <div className="space-y-1.5">
                  <Label>Wartungsdaten</Label>
                  <VertragPicker kundenId={kunde.id} />
                </div>
              </div>

              {/* Anrede + Titel */}
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

              {/* Vorname + Nachname */}
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

              {/* Firma */}
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
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email_secondary">E-Mail (geschäftlich)</Label>
                  <Input
                    id="email_secondary"
                    type="email"
                    value={form.email_secondary}
                    onChange={(e) => set("email_secondary", e.target.value)}
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
          <InternalComments
            refTable="kunden"
            refId={kunde.id}
            initialComments={initialKommentare}
          />

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
