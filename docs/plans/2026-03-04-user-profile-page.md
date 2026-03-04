# User Profile Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/profile` page where the logged-in user can view and edit their own data, accessed via an avatar dropdown replacing the current "Hey, email!" nav button.

**Architecture:** Server component fetches auth user + profile row, passes to a client form. Nav `AuthButton` is replaced by a `UserMenu` server component (avatar + dropdown). Server actions for updating own profile fields and password are separated from the existing admin `updateProfile` action.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Supabase SSR (`@supabase/ssr`), shadcn/ui (Avatar, DropdownMenu, Card, Input, Button already installed)

**Design doc:** `docs/plans/2026-03-04-user-profile-page-design.md`

---

### Task 1: Create feature branch

**Step 1: Create and switch to branch**

```bash
git checkout -b feature/user-profile
```

**Step 2: Verify**

```bash
git branch
```
Expected: `* feature/user-profile`

---

### Task 2: Create `LogoutMenuItem` client component

`LogoutButton` currently renders a full `<Button>`. We need a `DropdownMenuItem` variant for use inside the nav dropdown.

**Files:**
- Create: `components/dashboard/logout-menu-item.tsx`

**Step 1: Create the file**

```tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutMenuItem() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <DropdownMenuItem
      onClick={logout}
      className="cursor-pointer text-destructive focus:text-destructive"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Abmelden
    </DropdownMenuItem>
  );
}
```

**Step 2: Commit**

```bash
git add components/dashboard/logout-menu-item.tsx
git commit -m "feat: add LogoutMenuItem for use in nav dropdown"
```

---

### Task 3: Create `UserMenu` server component

Replaces `AuthButton`. Shows avatar with email initial, dropdown with "Mein Profil" link and logout.

**Files:**
- Create: `components/dashboard/user-menu.tsx`

**Step 1: Create the file**

```tsx
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogoutMenuItem } from "./logout-menu-item";
import { User } from "lucide-react";

export async function UserMenu() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/auth/login">Anmelden</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/auth/sign-up">Registrieren</Link>
        </Button>
      </div>
    );
  }

  const initial = (user.email as string)?.[0]?.toUpperCase() ?? "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full cursor-pointer">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-awadi-blue text-white text-sm font-medium">
              {initial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-normal text-xs text-muted-foreground truncate">
          {user.email as string}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="h-4 w-4 mr-2" />
            Mein Profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <LogoutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 2: Commit**

```bash
git add components/dashboard/user-menu.tsx
git commit -m "feat: add UserMenu avatar dropdown component"
```

---

### Task 4: Wire `UserMenu` into `DashboardNav`

**Files:**
- Modify: `components/dashboard/dashboard-nav.tsx`

**Step 1: Replace `AuthButton` import and usage**

In `components/dashboard/dashboard-nav.tsx`:

1. Remove the `AuthButton` import:
   ```tsx
   // DELETE this line:
   import { AuthButton } from "@/components/auth-button";
   ```

2. Add the `UserMenu` import:
   ```tsx
   import { UserMenu } from "./user-menu";
   ```

3. In the JSX, replace the `<AuthButton />` usage (currently inside a `<Suspense>`) with `<UserMenu />`. The `Suspense` wrapper stays — keep it for the loading fallback:
   ```tsx
   <Suspense
     fallback={
       <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
     }
   >
     <UserMenu />
   </Suspense>
   ```

**Step 2: Verify the app renders**

```bash
pnpm dev
```

Open http://localhost:3000 and confirm:
- Avatar circle with email initial appears in the top-right
- Clicking it opens a dropdown with "Mein Profil" and "Abmelden"
- Clicking "Abmelden" logs out and redirects to `/auth/login`

**Step 3: Commit**

```bash
git add components/dashboard/dashboard-nav.tsx
git commit -m "feat: replace AuthButton with UserMenu avatar dropdown in nav"
```

---

### Task 5: Create own-profile server actions

These are separate from the admin `updateProfile` in `lib/actions/profiles.ts`. They operate on the currently authenticated user only — no `id` parameter.

**Files:**
- Create: `lib/actions/own-profile.ts`

**Step 1: Create the file**

```ts
"use server";

import { createClient } from "@/lib/supabase/server";

export type UpdateOwnProfileInput = {
  vorname?: string;
  nachname?: string;
  telefonnr?: string;
  farbe?: string;
};

export async function updateOwnProfile(
  input: UpdateOwnProfileInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Nicht authentifiziert." };

  const { error } = await supabase
    .from("profiles")
    .update({ ...input, last_update: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateOwnPassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
```

**Step 2: Commit**

```bash
git add lib/actions/own-profile.ts
git commit -m "feat: add updateOwnProfile and updateOwnPassword server actions"
```

---

### Task 6: Create `ProfileEditForm` client component

**Files:**
- Create: `components/dashboard/profile-edit-form.tsx`

The form has four cards:
1. **Persönliche Daten** — vorname, nachname, telefon (editable)
2. **Konto** — email (read-only), rolle (read-only), farbe (editable)
3. **Sicherheit** — new password + confirm (own submit button)
4. **Supabase Konto** — auth metadata (read-only)

**Step 1: Create the file**

```tsx
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

interface ProfileEditFormProps {
  profile: Profile;
  authUser: User;
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
```

**Step 2: Commit**

```bash
git add components/dashboard/profile-edit-form.tsx
git commit -m "feat: add ProfileEditForm client component"
```

---

### Task 7: Create profile page

**Files:**
- Create: `app/(dashboard)/profile/page.tsx`

**Step 1: Create the page**

```tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/data/profiles";
import { ProfileEditForm } from "@/components/dashboard/profile-edit-form";
import { Skeleton } from "@/components/ui/skeleton";

async function ProfileContent() {
  const supabase = await createClient();

  // getUser() makes a network call to verify the session and returns full auth metadata
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) notFound();

  const profile = await getProfileById(authUser.id);
  if (!profile) notFound();

  return <ProfileEditForm profile={profile} authUser={authUser} />;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 w-full">
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileContent />
        </Suspense>
      </div>
    </div>
  );
}
```

**Step 2: Verify end-to-end**

```bash
pnpm dev
```

1. Log in
2. Click the avatar in the top-right
3. Click "Mein Profil" — should navigate to `/profile`
4. Verify all four cards render with real data
5. Edit vorname/nachname/telefon and click "Speichern" — should show green "Gespeichert"
6. Enter a new password (≥6 chars), confirm it, click "Passwort ändern" — should show "Passwort geändert"
7. Entering mismatched passwords should show an inline error without calling the server

**Step 3: Final commit**

```bash
git add app/(dashboard)/profile/page.tsx
git commit -m "feat: add user profile page at /profile"
```

---

### Optional cleanup (after feature is tested)

`components/auth-button.tsx` is no longer imported anywhere. It can be deleted:

```bash
git rm components/auth-button.tsx
git commit -m "chore: remove unused AuthButton component"
```
