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
import {
  updateProfile,
  type UpdateProfileInput,
} from "@/lib/actions/profiles";
import type { Profile, UserRolle } from "@/lib/types/profile";
import type { InternalComment } from "@/lib/types/kommentar";
import { InternalComments } from "@/components/dashboard/internal-comments";
import { Loader2, Check, ArrowLeft } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface UserEditFormProps {
  profile: Profile;
  initialKommentare: InternalComment[];
  rollen: UserRolle[];
}

type Day = "mo" | "di" | "mi" | "do" | "fr" | "sa" | "so";

const DAYS: { key: Day; label: string }[] = [
  { key: "mo", label: "Montag" },
  { key: "di", label: "Dienstag" },
  { key: "mi", label: "Mittwoch" },
  { key: "do", label: "Donnerstag" },
  { key: "fr", label: "Freitag" },
  { key: "sa", label: "Samstag" },
  { key: "so", label: "Sonntag" },
];

function toFormInput(profile: Profile): UpdateProfileInput {
  return {
    vorname: profile.vorname ?? "",
    nachname: profile.nachname ?? "",
    rollen_id: profile.rollen_id,
    telefonnr: profile.telefonnr ?? "",
    aktiv: profile.aktiv,
    farbe: profile.farbe ?? "",
    mo_von: profile.mo_von ?? null,
    mo_bis: profile.mo_bis ?? null,
    di_von: profile.di_von ?? null,
    di_bis: profile.di_bis ?? null,
    mi_von: profile.mi_von ?? null,
    mi_bis: profile.mi_bis ?? null,
    do_von: profile.do_von ?? null,
    do_bis: profile.do_bis ?? null,
    fr_von: profile.fr_von ?? null,
    fr_bis: profile.fr_bis ?? null,
    sa_von: profile.sa_von ?? null,
    sa_bis: profile.sa_bis ?? null,
    so_von: profile.so_von ?? null,
    so_bis: profile.so_bis ?? null,
  };
}

export function UserEditForm({ profile, initialKommentare, rollen }: UserEditFormProps) {
  const [form, setForm] = useState<UpdateProfileInput>(toFormInput(profile));
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof UpdateProfileInput>(
    field: K,
    value: UpdateProfileInput[K]
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  // Toggle a work day on/off
  const toggleDay = (day: Day, enabled: boolean) => {
    setForm((prev) => ({
      ...prev,
      [`${day}_von`]: enabled ? "08:00" : null,
      [`${day}_bis`]: enabled ? "17:00" : null,
    }));
  };

  const isDayEnabled = (day: Day) =>
    form[`${day}_von` as keyof UpdateProfileInput] != null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    setError(null);

    // Normalise empty strings to undefined
    const payload: UpdateProfileInput = {
      ...form,
      vorname: form.vorname || undefined,
      nachname: form.nachname || undefined,
      telefonnr: form.telefonnr || undefined,
      farbe: form.farbe || undefined,
    };

    const result = await updateProfile(profile.id, payload);

    setIsSaving(false);
    if (!result.success) {
      setError(result.error ?? "Unbekannter Fehler.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const displayName =
    [profile.vorname, profile.nachname].filter(Boolean).join(" ") ||
    profile.email;

  const metaInfo = [
    profile.created_at && `Erstellt: ${formatDateTime(profile.created_at)}`,
    profile.last_update && `Geändert: ${formatDateTime(profile.last_update)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href="/settings/users">
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

        {/* ── Benutzerdaten ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Benutzerdaten</CardTitle>
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

            <div className="space-y-1.5">
              <Label htmlFor="telefonnr">Telefon</Label>
              <Input
                id="telefonnr"
                type="tel"
                value={form.telefonnr ?? ""}
                onChange={(e) => set("telefonnr", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rolle">Rolle</Label>
              <Select
                value={String(form.rollen_id)}
                onValueChange={(v) => set("rollen_id", parseInt(v, 10))}
              >
                <SelectTrigger id="rolle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rollen.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="aktiv"
                checked={form.aktiv}
                onCheckedChange={(checked) => set("aktiv", !!checked)}
              />
              <Label htmlFor="aktiv">Aktiv</Label>
            </div>

          </CardContent>
        </Card>

        {/* ── Konto ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Konto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="space-y-1.5">
              <Label>E-Mail</Label>
              <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/30">
                {profile.email}
              </p>
              <p className="text-xs text-muted-foreground">
                Die E-Mail-Adresse wird über das Supabase-Konto verwaltet.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="farbe">Farbe</Label>
              <div className="flex items-center gap-2">
                <input
                  id="farbe"
                  type="color"
                  value={form.farbe || "#6366f1"}
                  onChange={(e) => set("farbe", e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border bg-transparent p-1"
                />
                <Input
                  value={form.farbe ?? ""}
                  onChange={(e) => set("farbe", e.target.value)}
                  placeholder="#6366f1"
                  className="font-mono"
                />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ── Arbeitszeiten ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Arbeitszeiten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Header row */}
              <div className="grid grid-cols-[140px_auto_1fr_1fr] gap-3 text-xs font-medium text-muted-foreground pb-1 border-b">
                <span>Tag</span>
                <span>Arbeitstag</span>
                <span>Von</span>
                <span>Bis</span>
              </div>

              {DAYS.map(({ key, label }) => {
                const enabled = isDayEnabled(key);
                return (
                  <div
                    key={key}
                    className="grid grid-cols-[140px_auto_1fr_1fr] gap-3 items-center"
                  >
                    <span className="text-sm">{label}</span>
                    <div className="flex justify-center">
                      <Checkbox
                        id={`${key}-enabled`}
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          toggleDay(key, !!checked)
                        }
                      />
                    </div>
                    <Input
                      type="time"
                      value={
                        (form[`${key}_von` as keyof UpdateProfileInput] as string | null) ?? ""
                      }
                      onChange={(e) =>
                        set(
                          `${key}_von` as keyof UpdateProfileInput,
                          e.target.value || null
                        )
                      }
                      disabled={!enabled}
                      className="disabled:opacity-40"
                    />
                    <Input
                      type="time"
                      value={
                        (form[`${key}_bis` as keyof UpdateProfileInput] as string | null) ?? ""
                      }
                      onChange={(e) =>
                        set(
                          `${key}_bis` as keyof UpdateProfileInput,
                          e.target.value || null
                        )
                      }
                      disabled={!enabled}
                      className="disabled:opacity-40"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Anmerkungen ───────────────────────────────────────── */}
        <InternalComments
          refTable="profiles"
          refId={profile.id}
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
