# Color Palette Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the near-white light mode theme with a layered blue-gray palette extracted from the AWADI logo, and give the nav bar a dark shell for strong visual contrast.

**Architecture:** All token values live in `app/globals.css` only. Two component files receive class changes to activate nav-specific colors. No other files change — everything else inherits the new tokens automatically via shadcn's semantic CSS variable system.

**Tech Stack:** Tailwind CSS v4, shadcn/ui (new-york), Next.js App Router, CSS custom properties with HSL triplets.

**Spec:** `docs/superpowers/specs/2026-03-23-color-palette-design.md`

---

## File Map

| File | Change Type | What Changes |
|---|---|---|
| `app/globals.css` | Modify | Add palette families to `@theme inline`; update 17 light-mode semantic tokens in `:root`; add 5 `--nav-*` tokens; update 4 `--awadi-*` tokens |
| `components/dashboard/dashboard-nav.tsx` | Modify | Replace transparent-bg header classes with dark nav classes; wrap ThemeSwitcher |
| `components/dashboard/nav-items.tsx` | Modify | Override active button state for dark nav context |

---

## Task 1: Add palette color families to `@theme inline`

**Files:**
- Modify: `app/globals.css` — `@theme inline` block (lines 6–48)

Note: This project has no test suite. Verification is `pnpm lint` (no errors) + visual check via `pnpm dev`.

- [ ] **Step 1: Add all four color families inside `@theme inline`**

In `app/globals.css`, add the following lines inside the `@theme inline { ... }` block, after the existing `--color-*` entries and before the closing `}`:

```css
  /* AWADI Logo Palette — charcoal-blue family */
  --color-charcoal-blue-50: #eff2f5;
  --color-charcoal-blue-100: #e0e4eb;
  --color-charcoal-blue-200: #c1c9d7;
  --color-charcoal-blue-300: #a2afc3;
  --color-charcoal-blue-400: #8394af;
  --color-charcoal-blue-500: #63799c;
  --color-charcoal-blue-600: #50617c;
  --color-charcoal-blue-700: #3c495d;
  --color-charcoal-blue-800: #28303e;
  --color-charcoal-blue-900: #14181f;
  --color-charcoal-blue-950: #0e1116;
  /* glaucous family */
  --color-glaucous-50: #f0f1f5;
  --color-glaucous-100: #e1e3ea;
  --color-glaucous-200: #c2c7d6;
  --color-glaucous-300: #a4acc1;
  --color-glaucous-400: #8690ac;
  --color-glaucous-500: #677498;
  --color-glaucous-600: #535d79;
  --color-glaucous-700: #3e465b;
  --color-glaucous-800: #292e3d;
  --color-glaucous-900: #15171e;
  --color-glaucous-950: #0e1015;
  /* powder-blue family */
  --color-powder-blue-50: #eff1f6;
  --color-powder-blue-100: #dfe3ec;
  --color-powder-blue-200: #bec7da;
  --color-powder-blue-300: #9eabc7;
  --color-powder-blue-400: #7d8fb5;
  --color-powder-blue-500: #5d73a2;
  --color-powder-blue-600: #4a5c82;
  --color-powder-blue-700: #384561;
  --color-powder-blue-800: #252e41;
  --color-powder-blue-900: #131720;
  --color-powder-blue-950: #0d1017;
  /* pale-slate family */
  --color-pale-slate-50: #eff1f6;
  --color-pale-slate-100: #dfe3ec;
  --color-pale-slate-200: #bfc7d9;
  --color-pale-slate-300: #9fabc6;
  --color-pale-slate-400: #7e8fb4;
  --color-pale-slate-500: #5e73a1;
  --color-pale-slate-600: #4b5c81;
  --color-pale-slate-700: #394560;
  --color-pale-slate-800: #262e40;
  --color-pale-slate-900: #131720;
  --color-pale-slate-950: #0d1016;
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add AWADI logo palette families to @theme inline"
```

---

## Task 2: Update semantic light-mode tokens in `:root`

**Files:**
- Modify: `app/globals.css` — `:root { ... }` block (lines 51–95)

- [ ] **Step 1: Replace the light-mode semantic token values**

In the `:root { ... }` block, replace the following existing token lines with the new values. The comment blocks can stay; only the HSL triplet values change.

**Background & surface:**
```css
    --background: 220 17% 90%;
    --foreground: 218 11% 10%;
    --card: 210 23% 95%;
    --card-foreground: 218 11% 10%;
    --popover: 210 23% 95%;
    --popover-foreground: 218 11% 10%;
```

**Primary (powder-blue-600) and secondary/muted (charcoal-blue-200):**
```css
    --primary: 222 29% 40%;
    --primary-foreground: 210 23% 95%;
    --secondary: 217 5% 80%;
    --secondary-foreground: 217 22% 20%;
    --muted: 217 5% 80%;
    --muted-foreground: 217 23% 40%;
```

**Accent (powder-blue-500), border, input, ring:**
```css
    --accent: 223 30% 50%;
    --accent-foreground: 210 23% 95%;
    --border: 217 20% 70%;
    --input: 217 20% 70%;
    --ring: 223 30% 50%;
```

Leave `--destructive`, `--destructive-foreground`, `--chart-*`, `--radius` unchanged.

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Start dev server and do a quick visual check**

```bash
pnpm dev
```

Open http://localhost:3000 in the browser. Expected: the page background is clearly blue-gray (not white), cards are slightly lighter than the page, text is dark and readable. The nav will still look broken (transparent) — that's fixed in Task 4.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: update light-mode semantic tokens to charcoal-blue/powder-blue palette"
```

---

## Task 3: Add nav tokens and update AWADI brand tokens

**Files:**
- Modify: `app/globals.css` — `:root { ... }` block, AWADI brand tokens section (lines 83–87)

- [ ] **Step 1: Add nav CSS custom properties to `:root`**

Inside the `:root { ... }` block, add these lines after the `--radius` line and before the `/* AWADI Brand Colors */` comment:

```css
    /* Nav tokens — dark shell */
    --nav-background: 217 22% 20%;
    --nav-foreground: 220 17% 90%;
    --nav-border: 218 22% 30%;
    --nav-item-hover: 218 22% 30%;
    --nav-item-active: 217 23% 40%;
```

- [ ] **Step 2: Update AWADI brand token values**

In the same `:root` block, replace the four `--awadi-*` lines:

```css
    --awadi-navy: 217 22% 20%;
    --awadi-blue: 222 29% 40%;
    --awadi-indigo: 223 30% 50%;
    --awadi-slate: 217 20% 70%;
```

- [ ] **Step 3: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: add nav tokens and update awadi brand tokens"
```

---

## Task 4: Update DashboardNav — dark shell

**Files:**
- Modify: `components/dashboard/dashboard-nav.tsx` — `<header>` element (line 12) and ThemeSwitcher usage (line 62)

- [ ] **Step 1: Replace the header className**

In `components/dashboard/dashboard-nav.tsx`, find the `<header>` opening tag (line 12):

```tsx
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
```

Replace with:

```tsx
    <header className="sticky top-0 z-50 w-full border-b bg-[hsl(var(--nav-background))] border-[hsl(var(--nav-border))] text-[hsl(var(--nav-foreground))]">
```

Changes made:
- `bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60` → `bg-[hsl(var(--nav-background))]` (solid dark background, no blur)
- `border-b` stays, but add `border-[hsl(var(--nav-border))]` (override border color)
- Add `text-[hsl(var(--nav-foreground))]` (light text cascades to all child elements)

- [ ] **Step 2: Wrap ThemeSwitcher to fix icon contrast**

In the same file, find the `<ThemeSwitcher />` usage inside the right-side div (around line 62):

```tsx
          <ThemeSwitcher />
```

Replace with:

```tsx
          <div className="text-[hsl(var(--nav-foreground))]">
            <ThemeSwitcher />
          </div>
```

This overrides the `text-muted-foreground` class hardcoded on the ThemeSwitcher icons, which would otherwise be too dark (~2.1:1 contrast) against the dark nav background.

- [ ] **Step 3: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 4: Visual check — nav appearance**

```bash
pnpm dev
```

Open http://localhost:3000. Expected:
- Nav bar is dark charcoal-blue, clearly distinct from the page content below
- AWADI logo text "AWADI" is light-colored and readable
- ThemeSwitcher icon is light (not dark/invisible)
- ATB logo is visible (SVG — check it renders against the dark bg)
- Nav links text is light and readable

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/dashboard-nav.tsx
git commit -m "feat: apply dark nav shell to DashboardNav"
```

---

## Task 5: Override nav button active states in NavItems

**Files:**
- Modify: `components/dashboard/nav-items.tsx` — three Button elements with `variant={isX ? "secondary" : "ghost"}`

**Background:** The shadcn `secondary` variant uses `bg-secondary` which is now `charcoal-blue-200` (light gray) — this would look out of place inside the dark nav. Ghost buttons inherit the nav's `text-[hsl(var(--nav-foreground))]` correctly (no text color set by ghost variant), but the active state must be overridden. The hover state for ghost (`hover:bg-accent hover:text-accent-foreground`) uses `powder-blue-500` hover which works on the dark nav.

- [ ] **Step 1: Add active-state class overrides to the Wartung button**

Find the Wartung Button (lines 58–68):

```tsx
      <Button
        variant={isMaintenance ? "secondary" : "ghost"}
        size="sm"
        asChild
        className="gap-2 cursor-pointer"
      >
```

Replace `className="gap-2 cursor-pointer"` with:

```tsx
        className={`gap-2 cursor-pointer text-[hsl(var(--nav-foreground))] hover:text-[hsl(var(--nav-foreground))] ${isMaintenance ? "bg-[hsl(var(--nav-item-active))] hover:bg-[hsl(var(--nav-item-active))]/80" : ""}`}
```

- [ ] **Step 2: Apply same pattern to the Tickets button**

Find the Tickets Button (lines 72–82) and replace its `className`:

```tsx
        className={`gap-2 cursor-pointer text-[hsl(var(--nav-foreground))] hover:text-[hsl(var(--nav-foreground))] ${isTickets ? "bg-[hsl(var(--nav-item-active))] hover:bg-[hsl(var(--nav-item-active))]/80" : ""}`}
```

- [ ] **Step 3: Apply same pattern to the Stammdaten dropdown trigger**

Find the Stammdaten DropdownMenuTrigger Button (lines 86–91) and replace its `className`:

```tsx
            className={`gap-2 cursor-pointer text-[hsl(var(--nav-foreground))] hover:text-[hsl(var(--nav-foreground))] ${isMasterData ? "bg-[hsl(var(--nav-item-active))] hover:bg-[hsl(var(--nav-item-active))]/80" : ""}`}
```

- [ ] **Step 4: Apply same pattern to the Einstellungen dropdown trigger**

Find the Einstellungen DropdownMenuTrigger Button (lines 118–124) and replace its `className`:

```tsx
            className={`gap-2 cursor-pointer text-[hsl(var(--nav-foreground))] hover:text-[hsl(var(--nav-foreground))] ${isSettings ? "bg-[hsl(var(--nav-item-active))] hover:bg-[hsl(var(--nav-item-active))]/80" : ""}`}
```

- [ ] **Step 5: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 6: Full visual verification**

```bash
pnpm dev
```

Open http://localhost:3000 and check:
- Inactive nav items: light text on dark background ✓
- Active nav item (e.g., navigate to `/`): slightly lighter bg on the active button, still readable ✓
- Hover state: blue accent hover visible on dark bg ✓
- Navigate to `/master-data/customers`: Stammdaten button shows active state ✓
- Navigate to `/settings/facility-types`: Einstellungen button shows active state ✓
- Switch to dark mode via ThemeSwitcher: check overall dark mode still looks reasonable ✓

- [ ] **Step 7: Commit**

```bash
git add components/dashboard/nav-items.tsx
git commit -m "feat: override nav button active states for dark nav context"
```
