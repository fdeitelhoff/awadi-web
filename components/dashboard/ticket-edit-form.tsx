"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateTicket,
  getKundeContactForTicket,
  type UpdateTicketInput,
} from "@/lib/actions/tickets";
import { KundePicker } from "@/components/dashboard/kunde-picker";
import { AnlagePicker } from "@/components/dashboard/anlage-picker";
import type { AnlagePickerResult } from "@/lib/actions/anlagen";
import { InternalComments } from "@/components/dashboard/internal-comments";
import type { InternalComment } from "@/lib/types/kommentar";
import type { TicketListItem } from "@/lib/types/ticket";
import { Loader2, Check, ArrowLeft } from "lucide-react";

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

// Local form state extends UpdateTicketInput to allow null for user_id/user_name
type FormState = Omit<UpdateTicketInput, "user_id" | "user_name"> & {
  user_id?: string | null;
  user_name?: string | null;
};

interface TicketEditFormProps {
  ticket: TicketListItem;
  techniker: { id: string; name: string }[];
  initialComments: InternalComment[];
}

export function TicketEditForm({
  ticket,
  techniker,
  initialComments,
}: TicketEditFormProps) {
  const [form, setForm] = useState<FormState>({
    titel: ticket.titel ?? "",
    beschreibung: ticket.beschreibung ?? "",
    status: ticket.status,
    prioritaet: ticket.prioritaet,
    kunden_id: ticket.kunden_id,
    anlage_id: ticket.anlage_id,
    anlage_name: ticket.anlage_name ?? "",
    vorname: ticket.vorname ?? "",
    nachname: ticket.nachname ?? "",
    email: ticket.email ?? "",
    telefonnr: ticket.telefonnr ?? "",
    strasse: ticket.strasse ?? "",
    hausnr: ticket.hausnr ?? "",
    plz: ticket.plz ?? "",
    ort: ticket.ort ?? "",
    user_id: ticket.user_id ?? null,
    user_name: ticket.user_name ?? null,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof FormState, value: string | number | undefined) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleKundeChange = async (id: number | null) => {
    set("kunden_id", id ?? undefined);
    if (id == null) return;
    const contact = await getKundeContactForTicket(id);
    if (contact) {
      setForm((prev) => ({
        ...prev,
        kunden_id: id,
        vorname: contact.vorname ?? "",
        nachname: contact.nachname ?? "",
        email: contact.email ?? "",
        telefonnr: contact.telefonnr ?? "",
        strasse: contact.strasse ?? "",
        hausnr: contact.hausnr ?? "",
        plz: contact.plz ?? "",
        ort: contact.ort ?? "",
      }));
    }
  };

  const handleAnlageChange = async (
    id: number | null,
    details: AnlagePickerResult | null
  ) => {
    if (id == null || details == null) {
      set("anlage_id", undefined);
      return;
    }
    const newKundenId = details.kunden_id;
    // Read kunden_id from current form state BEFORE any setForm calls (avoids stale closure)
    const effectiveKundeId = form.kunden_id ?? newKundenId;

    if (effectiveKundeId) {
      const contact = await getKundeContactForTicket(effectiveKundeId);
      setForm((prev) => ({
        ...prev,
        anlage_id: id,
        anlage_name: details.anl_typ_bezeichnung ?? "",
        kunden_id: prev.kunden_id ?? newKundenId,
        ...(contact ? {
          vorname: contact.vorname ?? "",
          nachname: contact.nachname ?? "",
          email: contact.email ?? "",
          telefonnr: contact.telefonnr ?? "",
          strasse: contact.strasse ?? "",
          hausnr: contact.hausnr ?? "",
          plz: contact.plz ?? "",
          ort: contact.ort ?? "",
        } : {}),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        anlage_id: id,
        anlage_name: details.anl_typ_bezeichnung ?? "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titel?.trim()) {
      setError("Bitte einen Titel angeben.");
      return;
    }
    setIsSaving(true);
    setSaved(false);
    setError(null);

    const result = await updateTicket(ticket.id, form as UpdateTicketInput);
    setIsSaving(false);
    if (!result.success) {
      setError(result.error ?? "Unbekannter Fehler.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  // Build initial SelectedAnlage for the picker (if ticket has an anlage)
  const initialAnlage = ticket.anlage_id
    ? {
        id: ticket.anlage_id,
        label: ticket.anlagen_nr ?? `Anlage #${ticket.anlage_id}`,
        sublabel: ticket.anlage_name || undefined,
      }
    : undefined;

  // Build initial SelectedKunde for the picker (if ticket has a kunde)
  const initialKunde =
    ticket.kunden_id && ticket.kunden_name
      ? {
          id: ticket.kunden_id,
          name: ticket.kunden_name,
          address: "",
        }
      : undefined;

  const displayTitle = ticket.ticket_nr ?? "Ticket";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href="/tickets">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Link>
        </Button>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{displayTitle}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Erstellt: {formatDateTime(ticket.created_at)}
              {ticket.updated_at && (
                <> · Geändert: {formatDateTime(ticket.updated_at)}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {saved && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-success" />
                Gespeichert
              </span>
            )}
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Ticketdaten ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ticketdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="space-y-1.5">
              <Label htmlFor="titel">
                Titel <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titel"
                value={form.titel ?? ""}
                onChange={(e) => set("titel", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="beschreibung">Beschreibung</Label>
              <Textarea
                id="beschreibung"
                value={form.beschreibung ?? ""}
                onChange={(e) => set("beschreibung", e.target.value)}
                rows={4}
              />
            </div>

          </CardContent>
        </Card>

        {/* ── Zuordnung ────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zuordnung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status ?? "offen"}
                  onValueChange={(v) => set("status", v)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offen">Offen</SelectItem>
                    <SelectItem value="eingeplant">Eingeplant</SelectItem>
                    <SelectItem value="gelöst">Gelöst</SelectItem>
                    <SelectItem value="geschlossen">Geschlossen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prioritaet">Priorität</Label>
                <Select
                  value={form.prioritaet ?? "normal"}
                  onValueChange={(v) => set("prioritaet", v)}
                >
                  <SelectTrigger id="prioritaet">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="hoch">Hoch</SelectItem>
                    <SelectItem value="dringend">Dringend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Kunde</Label>
              <KundePicker
                value={form.kunden_id ?? null}
                onChange={handleKundeChange}
                initial={initialKunde}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Anlage</Label>
              <AnlagePicker
                value={form.anlage_id ?? null}
                onChange={handleAnlageChange}
                initial={initialAnlage}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="anlage_name">Anlagenbezeichnung</Label>
              <Input
                id="anlage_name"
                value={form.anlage_name ?? ""}
                onChange={(e) => set("anlage_name", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="techniker">Techniker</Label>
              <Select
                value={form.user_id ?? "none"}
                onValueChange={(v) => {
                  if (v === "none") {
                    setForm((prev) => ({ ...prev, user_id: null, user_name: null }));
                  } else {
                    const t = techniker.find((t) => t.id === v);
                    setForm((prev) => ({ ...prev, user_id: v, user_name: t?.name ?? null }));
                  }
                }}
              >
                <SelectTrigger id="techniker">
                  <SelectValue placeholder="Techniker auswählen…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Kein Techniker —</SelectItem>
                  {techniker.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>

        {/* ── Kontaktperson ────────────────────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Kontaktperson</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="vorname">Vorname</Label>
                <Input
                  id="vorname"
                  value={form.vorname ?? ""}
                  onChange={(e) => set("vorname", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nachname">Nachname</Label>
                <Input
                  id="nachname"
                  value={form.nachname ?? ""}
                  onChange={(e) => set("nachname", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefonnr">Telefon</Label>
                <Input
                  id="telefonnr"
                  value={form.telefonnr ?? ""}
                  onChange={(e) => set("telefonnr", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_100px] gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="strasse">Straße</Label>
                <Input
                  id="strasse"
                  value={form.strasse ?? ""}
                  onChange={(e) => set("strasse", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hausnr">Nr.</Label>
                <Input
                  id="hausnr"
                  value={form.hausnr ?? ""}
                  onChange={(e) => set("hausnr", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-[90px_1fr] gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="plz">PLZ</Label>
                <Input
                  id="plz"
                  value={form.plz ?? ""}
                  onChange={(e) => set("plz", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ort">Ort</Label>
                <Input
                  id="ort"
                  value={form.ort ?? ""}
                  onChange={(e) => set("ort", e.target.value)}
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

      {/* ── Interne Anmerkungen ──────────────────────────────────── */}
      <InternalComments
        refTable="tickets"
        refId={ticket.id}
        initialComments={initialComments}
      />

    </form>
  );
}
