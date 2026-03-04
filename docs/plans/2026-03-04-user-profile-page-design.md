# User Profile Page — Design

**Date:** 2026-03-04
**Status:** Approved

## Overview

A dedicated profile page at `/profile` where the logged-in user can view and edit their own data. Access via a user avatar dropdown in the nav bar (replacing the current "Hey, email!" AuthButton).

## Goals

- Show the user their own profile and Supabase auth data
- Allow editing: first/last name, phone, color, password
- Keep admin-only fields (role, active, work hours) read-only or hidden
- Provide logout from the avatar dropdown

## Out of Scope

- Avatar image upload
- Email change (requires re-confirmation flow)
- Two-factor authentication setup
- Internal comments (admin-only)
- Work hours display (admin-managed)

---

## Architecture

### Navigation change — `UserMenu`

Replace `AuthButton` in `DashboardNav` with a new `UserMenu` server component.

- Fetches current user via `supabase.auth.getClaims()` (same as current AuthButton)
- Renders an avatar button with the user's initials (derived from `vorname`/`nachname` in profile, fallback to email initial)
- `DropdownMenu` with:
  - "Mein Profil" → link to `/profile`
  - Separator
  - "Abmelden" → `LogoutButton` (existing component, moved here)
- Unauthenticated: shows Sign in / Sign up buttons (same as current AuthButton)

**Files changed:**
- `components/auth-button.tsx` → replaced by `components/dashboard/user-menu.tsx`
- `components/dashboard/dashboard-nav.tsx` → import `UserMenu` instead of `AuthButton`

---

### Route — `app/(dashboard)/profile/page.tsx`

PPR pattern (non-async outer page, async inner component in Suspense):

```
ProfilePage (non-async, default export)
└── <Suspense fallback={<ProfileSkeleton />}>
    └── <ProfileContent /> (async server component)
        ├── supabase.auth.getUser() → full auth user
        ├── getProfileById(user.id) → Profile row
        └── <ProfileEditForm profile={...} authUser={...} />
```

`getUser()` is used (not `getClaims()`) to get full auth metadata: `created_at`, `last_sign_in_at`, `confirmed_at`, `app_metadata.provider`.

---

### Client component — `ProfileEditForm`

`components/dashboard/profile-edit-form.tsx`

Four cards in a 2-column grid (same layout as `UserEditForm`):

| Card | Fields | Editable |
|---|---|---|
| Persönliche Daten | Vorname, Nachname, Telefon | Yes |
| Konto | Email (readonly), Rolle (readonly), Farbe (color picker) | Color only |
| Sicherheit | Neues Passwort, Passwort bestätigen | Yes |
| Supabase Konto | Erstellt, Letzter Login, E-Mail bestätigt, Anbieter | No |

Two separate save actions:
- **Profil speichern** button → `updateOwnProfile()`
- **Passwort ändern** button (in the Sicherheit card) → `updateOwnPassword()`

Password fields are independent — they have their own submit button and do not mix with profile fields.

---

### Server actions — `lib/actions/own-profile.ts`

**`updateOwnProfile(input)`**
- Authenticates via session (no `id` param)
- Updates only: `vorname`, `nachname`, `telefonnr`, `farbe`
- Returns `{ success: boolean; error?: string }`

**`updateOwnPassword(newPassword: string)`**
- Calls `supabase.auth.updateUser({ password: newPassword })`
- Returns `{ success: boolean; error?: string }`
- Client validates that new password and confirm match before calling

---

## File List

| Action | File |
|---|---|
| Create | `components/dashboard/user-menu.tsx` |
| Modify | `components/dashboard/dashboard-nav.tsx` |
| Create | `app/(dashboard)/profile/page.tsx` |
| Create | `components/dashboard/profile-edit-form.tsx` |
| Create | `lib/actions/own-profile.ts` |
| Delete (or keep as unused) | `components/auth-button.tsx` |
