# Ticket System — Data Table (Phase 1)

**Date:** 2026-03-17
**Branch:** feature/ticket-system
**Status:** Approved

## Scope

Phase 1 covers: database schema, TypeScript types, data layer, server actions (fetch + delete only), table UI, and nav entry. Create/edit forms are a later phase.

---

## Database

### `public.tickets` table

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | auto-increment |
| `ticket_nr` | `TEXT UNIQUE` | auto-set by trigger: `TK-{year}-{id:04d}` |
| `titel` | `TEXT NOT NULL` | |
| `beschreibung` | `TEXT` | |
| `status` | `TEXT NOT NULL DEFAULT 'offen'` | offen / eingeplant / gelöst / geschlossen |
| `prioritaet` | `TEXT NOT NULL DEFAULT 'normal'` | normal / hoch / dringend |
| `kunden_id` | `BIGINT → kunden(id)` | nullable FK |
| `anlage_id` | `BIGINT → anlagen(id)` | nullable FK |
| `anlage_name` | `TEXT` | free-text facility name when anlage_id is null |
| `vorname` | `TEXT` | ad-hoc contact or copied from customer |
| `nachname` | `TEXT` | |
| `email` | `TEXT` | |
| `telefonnr` | `TEXT` | |
| `strasse` | `TEXT` | |
| `hausnr` | `TEXT` | |
| `plz` | `TEXT` | |
| `ort` | `TEXT` | |
| `user_id` | `UUID → auth.users` | who created it |
| `user_name` | `TEXT` | display name snapshot |
| `created_at` | `TIMESTAMPTZ DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | |

### Ticket-Nr trigger

On INSERT, generates `ticket_nr = 'TK-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(NEW.id::TEXT, 4, '0')`. Uses the auto-increment `id` as sequence — no year reset, no race conditions.

```sql
CREATE OR REPLACE FUNCTION generate_ticket_nr()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_nr := 'TK-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(NEW.id::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_nr
  BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_nr();
```

### `tickets_details` view

Joins `kunden` for `kunden_name` and `anlagen` for `anlagen_nr`:

```sql
CREATE OR REPLACE VIEW public.tickets_details AS
SELECT
  t.*,
  k.nachname || COALESCE(', ' || k.vorname, '') AS kunden_name,
  a.anlagen_nr
FROM public.tickets t
LEFT JOIN public.kunden k ON k.id = t.kunden_id
LEFT JOIN public.anlagen a ON a.id = t.anlage_id;
```

---

## TypeScript

### `lib/types/ticket.ts`

```ts
export type TicketStatus = "offen" | "eingeplant" | "gelöst" | "geschlossen";
export type TicketPriorität = "normal" | "hoch" | "dringend";
export type TicketSortField = "ticket_nr" | "titel" | "status" | "prioritaet" | "created_at";
export type SortDirection = "asc" | "desc";

export interface Ticket {
  id: number;
  ticket_nr: string;
  titel: string;
  beschreibung?: string;
  status: TicketStatus;
  prioritaet: TicketPriorität;
  kunden_id?: number;
  anlage_id?: number;
  anlage_name?: string;
  vorname?: string;
  nachname?: string;
  email?: string;
  telefonnr?: string;
  strasse?: string;
  hausnr?: string;
  plz?: string;
  ort?: string;
  user_id?: string;
  user_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface TicketListItem extends Ticket {
  kunden_name?: string;  // from kunden join
  anlagen_nr?: string;   // from anlagen join
}

export interface TicketQueryParams {
  search?: string;
  filterStatus?: TicketStatus | "all";
  filterPriorität?: TicketPriorität | "all";
  sortField?: TicketSortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface TicketQueryResult {
  data: TicketListItem[];
  totalCount: number;
}
```

---

## Data Layer

### `lib/data/tickets.ts`
- `mapRowToTicket(row)` — maps DB row to `TicketListItem`
- `getTickets(params)` — queries `tickets_details`, supports search (ticket_nr, titel, nachname, vorname, email, kunden_name, anlagen_nr, anlage_name), filter by status + priorität, sort, paginate (PAGE_SIZE=14)
- `getTicketById(id)` — single record from `tickets_details`
- `getTicketCount()` — total count for header

### `lib/actions/tickets.ts`
- `fetchTickets(params)` — server action wrapping `getTickets`
- `deleteTicket(id)` — server action, returns `{ success, error? }`

---

## UI

### Nav entry

Top-level button "Tickets" (lucide `Ticket` icon) between "Wartung" and "Stammdaten" in `components/dashboard/nav-items.tsx`. Route: `/tickets`.

### Pages

```
app/(dashboard)/tickets/page.tsx   ← list page, Suspense wrapper
```

### Components

```
components/dashboard/ticket-table-server.tsx  ← async server wrapper
components/dashboard/ticket-table.tsx         ← client table
```

### Table columns (COLSPAN = 9)

| # | Header | Value | Sortable |
|---|---|---|---|
| 1 | Ticket-Nr. | `ticket_nr` | yes |
| 2 | Titel | `titel` | yes |
| 3 | Status | badge | yes |
| 4 | Priorität | badge | yes |
| 5 | Kontakt | `kunden_name` if set, else `vorname + nachname` | — |
| 6 | E-Mail | `email`, clickable `mailto:` with stopPropagation | — |
| 7 | Anlage | `anlagen_nr` if set, else `anlage_name`, else `—` | — |
| 8 | Erstellt am | `created_at`, German date format | yes |
| — | (actions) | delete button | — |

### Badge colors

**Status:**
- `offen` → `info` (blue)
- `eingeplant` → `warning` (yellow/orange)
- `gelöst` → `success` (green)
- `geschlossen` → muted (gray)

**Priorität:**
- `normal` → muted
- `hoch` → `warning`
- `dringend` → `destructive`

### Filters

- Status: all / offen / eingeplant / gelöst / geschlossen
- Priorität: all / normal / hoch / dringend

---

## Non-Goals (this phase)

- Create ticket form
- Edit ticket form
- Ticket detail page
- Internal comments on tickets
- Assignment to technician
