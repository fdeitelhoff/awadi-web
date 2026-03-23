# Color Palette Redesign — Design Spec

**Date:** 2026-03-23
**Status:** Approved
**Scope:** `app/globals.css`, `components/dashboard/dashboard-nav.tsx`, `components/dashboard/nav-items.tsx`

---

## Problem

User feedback: the light mode UI is "all too white with some black text — not very readable." Root cause: `--background` (97% lightness) and `--card` (100% lightness) are visually identical, borders are too subtle (`charcoal-blue-88%`), and the nav blends into the page with no visual anchor. There is no surface hierarchy.

---

## Solution Overview

Use the AWADI logo-extracted color palette (`charcoal-blue`, `powder-blue` families) to:

1. Give the page canvas a clear blue-gray tint (`charcoal-blue-100`)
2. Make cards visibly lighter than the canvas (`charcoal-blue-50`), creating elevation
3. Strengthen borders (`charcoal-blue-300`)
4. Give the nav strong contrast with a dark shell (`charcoal-blue-800`)

Dark mode and all business logic are untouched.

---

## Section 1: Semantic Token Mapping (Light Mode)

All values expressed as HSL triplets for the existing `hsl(var(--token))` system.

| Token | Current HSL | New Color | Hex | New HSL (approx) |
|---|---|---|---|---|
| `--background` | 220 20% 97% | charcoal-blue-100 | #e0e4eb | 220 17% 90% |
| `--foreground` | 217 33% 17% | charcoal-blue-900 | #14181f | 218 21% 10% |
| `--card` | 220 25% 100% | charcoal-blue-50 | #eff2f5 | 210 18% 95% |
| `--card-foreground` | 217 33% 17% | charcoal-blue-900 | #14181f | 218 21% 10% |
| `--popover` | 220 25% 100% | charcoal-blue-50 | #eff2f5 | 210 18% 95% |
| `--popover-foreground` | 217 33% 17% | charcoal-blue-900 | #14181f | 218 21% 10% |
| `--primary` | 217 33% 34% | powder-blue-600 | #495c83 | 222 29% 40% |
| `--primary-foreground` | 220 20% 98% | charcoal-blue-50 | #eff2f5 | 210 18% 95% |
| `--secondary` | 220 18% 93% | charcoal-blue-200 | #c1c9d7 | 217 18% 80% |
| `--secondary-foreground` | 217 33% 25% | charcoal-blue-800 | #28303e | 217 22% 20% |
| `--muted` | 220 15% 94% | charcoal-blue-200 | #c1c9d7 | 217 18% 80% |
| `--muted-foreground` | 217 15% 46% | charcoal-blue-600 | #50617c | 217 23% 40% |
| `--accent` | 229 35% 55% | powder-blue-500 | #5c72a3 | 223 30% 50% |
| `--accent-foreground` | 220 20% 98% | charcoal-blue-50 | #eff2f5 | 210 18% 95% |
| `--border` | 220 18% 88% | charcoal-blue-300 | #a2afc3 | 217 20% 70% |
| `--input` | 220 18% 88% | charcoal-blue-300 | #a2afc3 | 217 20% 70% |
| `--ring` | 217 33% 34% | powder-blue-500 | #5c72a3 | 223 30% 50% |

**Destructive, chart tokens:** unchanged.

### WCAG Contrast Ratios

| Pairing | Ratio | Level |
|---|---|---|
| foreground on card (900 on 50) | 16.5:1 | AAA |
| foreground on background (900 on 100) | 14.8:1 | AAA |
| muted-foreground on card (600 on 50) | 5.6:1 | AA |
| muted-foreground on background (600 on 100) | 5.0:1 | AA |
| primary-foreground on primary (50 on 600) | 6.1:1 | AA |

---

## Section 2: Navigation Bar Tokens

New tokens added to `:root` in `globals.css`:

| Token | Color | Hex | HSL |
|---|---|---|---|
| `--nav-background` | charcoal-blue-800 | #28303e | 217 22% 20% |
| `--nav-foreground` | charcoal-blue-100 | #e0e4eb | 220 17% 90% |
| `--nav-border` | charcoal-blue-700 | #3c495d | 218 22% 30% |
| `--nav-item-hover` | charcoal-blue-700 | #3c495d | 218 22% 30% |
| `--nav-item-active` | charcoal-blue-600 | #50617c | 217 23% 40% |

**Nav contrast:** nav-foreground on nav-background = 12.4:1 (AAA).

**Dark mode nav:** `--nav-background` falls back to matching `--background` (already dark), so no dark mode override needed.

---

## Section 3: New Palette Variables

The full color families are registered in `@theme inline` for Tailwind utility access and future palette switching. Only `charcoal-blue` and `powder-blue` are wired into semantic tokens; `glaucous` and `pale-slate` are registered for future use.

```css
/* Tailwind v4 — add to @theme inline */
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

### Updated AWADI Brand Tokens

| Token | Old | New |
|---|---|---|
| `--awadi-navy` | 217 33% 34% | charcoal-blue-800 → 217 22% 20% |
| `--awadi-blue` | 225 25% 46% | powder-blue-600 → 222 29% 40% |
| `--awadi-indigo` | 229 35% 55% | powder-blue-500 → 223 30% 50% |
| `--awadi-slate` | 220 18% 76% | charcoal-blue-300 → 217 20% 70% |

---

## Section 4: Implementation Scope

### Files to change

**`app/globals.css`**
- Add full palette families to `@theme inline`
- Update 17 semantic token HSL values in `:root` (light mode only)
- Add 5 `--nav-*` tokens to `:root`
- Update 4 `--awadi-*` tokens in `:root`
- Dark mode (`.dark`) block: no changes

**`components/dashboard/dashboard-nav.tsx`**
- Replace `bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b`
  with `bg-[var(--nav-background)] border-b border-[var(--nav-border)]`
- Add `text-[var(--nav-foreground)]` to the `<header>` element
- Remove `backdrop-blur` (no longer needed on opaque dark surface)

**`components/dashboard/nav-items.tsx`**
- Ghost button variant inherits text color from context — add explicit `text-[var(--nav-foreground)]` to inactive button variants so they render light text against the dark nav background
- Active `variant="secondary"` button: override with `bg-[var(--nav-item-active)] text-[var(--nav-foreground)]`

### Files that do NOT change
Everything else. All other components inherit the updated semantic tokens automatically. No business logic, no status colors, no form components, no tables.

---

## Non-Goals

- No dark mode changes
- No new components
- No palette-switching UI (future work)
- No changes to status badge colors (success/warning/info/destructive)
