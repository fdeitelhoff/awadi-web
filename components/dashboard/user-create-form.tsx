"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { inviteUser, type UpdateProfileInput } from "@/lib/actions/profiles";
import type { UserRolle } from "@/lib/types/profile";
import { AbwesenheitenCard } from "@/components/dashboard/abwesenheiten-card";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

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

function emptyForm(rollen: UserRolle[]): UpdateProfileInput {
  return {
    vorname: "",
    nachname: "",
    rollen_id: rollen[0]?.id ?? 0,
    telefonnr: "",
  aktiv: true,
  farbe: "",
    mo_von: null, mo_bis: null,
    di_von: null, di_bis: null,
    mi_von: null, mi_bis: null,
    do_von: null, do_bis: null,
    fr_von: null, fr_bis: null,
    sa_von: null, sa_bis: null,
    so_von: null, so_bis: null,
  };
}

interface UserCreateFormProps {
  rollen: UserRolle[];
}

export function UserCreateForm({ rollen }: UserCreateFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<UpdateProfileInput>(() => emptyForm(rollen));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof UpdateProfileInput>(
    field: K,
    value: UpdateProfileInput[K]
  ) => setForm((prev) => ({ ...prev, [field]: value }));

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
    if (!email.trim()) {
      setError("Bitte eine E-Mail-Adresse eingeben.");
      return;
    }
    setIsSaving(true);
    setError(null);

    const result = await inviteUser({
      email: email.trim(),
      ...form,
      vorname: form.vorname || undefined,
      nachname: form.nachname || undefined,
      telefonnr: form.telefonnr || undefined,
      farbe: form.farbe || undefined,
    });

    if (!result.success) {
      setIsSaving(false);
      setError(result.error ?? "Unbekannter Fehler.");
      return;
    }

    router.push(`/settings/users/${result.id}`);
  };

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
          <h1 className="text-2xl font-semibold">Neuer Benutzer</h1>
          <Button type="submit" disabled={isSaving} className="shrink-0">
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Einladen
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
              <Label htmlFor="email">
                E-Mail <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="benutzer@firma.de"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Der Benutzer erhält eine Einladungs-E-Mail und kann dann sein Passwort festlegen.
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

        {/* ── Abwesenheiten ─────────────────────────────────────── */}
        <AbwesenheitenCard userId={null} initialAbwesenheiten={[]} />

        {/* ── Arbeitszeiten ─────────────────────────────────────── */}
        <Card className="lg:col-span-2">
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

      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-8">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && <span />}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Einladen
        </Button>
      </div>

    </form>
  );
}
