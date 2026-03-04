"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  updateOwnProfile,
  updateOwnPassword,
  type UpdateOwnProfileInput,
} from "@/lib/actions/own-profile";
import type { Profile } from "@/lib/types/profile";
import { Check, Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { formatDateTime } from "@/lib/utils";

interface ProfileEditFormProps {
  profile: Profile;
  authUser: User;
}

export function ProfileEditForm({ profile, authUser }: ProfileEditFormProps) {
  // Profile fields
  const [form, setForm] = useState<UpdateOwnProfileInput>({
    vorname: profile.vorname ?? "",
    nachname: profile.nachname ?? "",
    telefonnr: profile.telefonnr ?? "",
    farbe: profile.farbe ?? "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const set = <K extends keyof UpdateOwnProfileInput>(
    field: K,
    value: UpdateOwnProfileInput[K]
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaved(false);
    setProfileError(null);

    const result = await updateOwnProfile({
      vorname: form.vorname || undefined,
      nachname: form.nachname || undefined,
      telefonnr: form.telefonnr || undefined,
      farbe: form.farbe || undefined,
    });

    setIsSavingProfile(false);
    if (!result.success) {
      setProfileError(result.error ?? "Unbekannter Fehler.");
    } else {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (newPassword.length < 6) {
      setPasswordError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setIsSavingPassword(true);
    const result = await updateOwnPassword(newPassword);
    setIsSavingPassword(false);

    if (!result.success) {
      setPasswordError(result.error ?? "Unbekannter Fehler.");
    } else {
      setPasswordSaved(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSaved(false), 3000);
    }
  };

  const displayName =
    [profile.vorname, profile.nachname].filter(Boolean).join(" ") ||
    profile.email;

  const provider = authUser.app_metadata?.provider ?? "email";

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold">{displayName}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Mein Profil</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Persönliche Daten ─────────────────────────────────── */}
        <form onSubmit={handleProfileSubmit} className="contents">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Persönliche Daten</CardTitle>
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

              <div className="flex items-center justify-between pt-2">
                {profileError && (
                  <p className="text-sm text-destructive">{profileError}</p>
                )}
                {!profileError && profileSaved && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Gespeichert
                  </p>
                )}
                {!profileError && !profileSaved && <span />}
                <Button type="submit" disabled={isSavingProfile} size="sm">
                  {isSavingProfile && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

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
            </div>
            <div className="space-y-1.5">
              <Label>Rolle</Label>
              <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/30">
                {profile.rollen_name ?? `Rolle ${profile.rollen_id}`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Sicherheit ────────────────────────────────────────── */}
        <form onSubmit={handlePasswordSubmit} className="contents">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sicherheit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Mindestens 6 Zeichen"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
                {!passwordError && passwordSaved && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Passwort geändert
                  </p>
                )}
                {!passwordError && !passwordSaved && <span />}
                <Button
                  type="submit"
                  disabled={isSavingPassword || !newPassword}
                  size="sm"
                >
                  {isSavingPassword && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Passwort ändern
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* ── Supabase Konto ────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supabase Konto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Erstellt</p>
                <p>{formatDateTime(authUser.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Letzter Login</p>
                <p>{formatDateTime(authUser.last_sign_in_at)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">E-Mail bestätigt</p>
                <Badge variant={authUser.email_confirmed_at ? "default" : "secondary"}>
                  {authUser.email_confirmed_at ? "Bestätigt" : "Ausstehend"}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Anbieter</p>
                <Badge variant="outline" className="font-mono text-xs">
                  {provider}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
