# Global Search — Design Document

**Date:** 2026-03-08
**Status:** Approved

## Overview

A global search feature in the top navigation bar. The user types a query, presses Enter, and results appear in a dropdown. Each result shows the entity type and navigates to its detail/edit page on click.

## Approach

Server Action + local dropdown state. On Enter, a Next.js server action runs a single `UNION ALL` SQL query across all 6 tables using `ILIKE` matching. Results are stored in component state and rendered in a dropdown. Consistent with the existing server action pattern in this codebase.

## Searched Entities

| Entity | Table | Searched Columns | Label | Sublabel |
|--------|-------|-----------------|-------|----------|
| Kunde | `kunden` | nachname, vorname, firma, kundennr, email, ort | firma or "Vorname Nachname" | kundennr |
| Anlage | `anlagen` | anlagen_nr, ort, strasse, plz | anlagen_nr | ort |
| Kontakt | `kontakte` | nachname, vorname, firma, email, ort | firma or "Vorname Nachname" | email |
| Wartungsvertrag | `wartungsvertraege` | vertragsnummer, comment | vertragsnummer | gueltig_ab – gueltig_bis |
| Anlagentyp | `anl_typen` | bezeichnung, comment | bezeichnung | wartungsintervall_monate · preis_je_wartung |
| Benutzer | `profiles` | vorname, nachname, email | "Vorname Nachname" | email |

Max 3 results per type = up to 18 results total, grouped by type.

## Types

```typescript
type SearchResultType = 'kunde' | 'anlage' | 'kontakt' | 'wartungsvertrag' | 'anlagentyp' | 'benutzer';

interface SearchResult {
  id: string;
  type: SearchResultType;
  label: string;
  sublabel?: string;
  href: string;
}
```

## UI / UX

- **Input:** Search icon left, X button right (visible only when input has text). Enter triggers search, Escape closes dropdown.
- **Dropdown:** Appears below input, full width, `z-50`, shadcn card with `shadow-lg`. Results grouped by type with section headers. Each row: type icon + label + muted sublabel. Spinner while loading, "Keine Ergebnisse" if empty. Closes on outside click or result selection.
- **Navigation:** Clicking a result calls `router.push(href)` to the entity's edit page.

### Result Routes

| Type | Route |
|------|-------|
| Kunde | `/master-data/customers/[id]/edit` |
| Anlage | `/master-data/facilities/[id]/edit` |
| Kontakt | `/master-data/contacts/[id]/edit` |
| Wartungsvertrag | `/master-data/maintenance/[id]/edit` |
| Anlagentyp | `/settings/facility-types/[id]/edit` |
| Benutzer | `/settings/users/[id]/edit` |

## Files

### New
- `lib/actions/search.ts` — server action `searchAll(query: string): Promise<SearchResult[]>`
- `components/dashboard/global-search.tsx` — client component (input + dropdown)

### Modified
- `components/dashboard/dashboard-nav.tsx` — replace `<SearchInput />` with `<GlobalSearch />`

## Data Flow

1. User types query → presses Enter
2. `searchAll(query)` server action executes UNION ALL with parameterized `ILIKE '%query%'`
3. Results stored in `useState`, dropdown renders grouped by type
4. Click result → `router.push(href)` → dropdown closes
5. X button → clears input + closes dropdown

## Security

SQL injection is prevented by using parameterized queries via the Supabase client (not string interpolation).

## No DB Migrations Required

Reads only from existing tables.
