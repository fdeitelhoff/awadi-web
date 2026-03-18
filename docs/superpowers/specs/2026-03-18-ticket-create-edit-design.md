# Ticket Create / Edit / Delete — Design Spec

**Date:** 2026-03-18
**Branch:** feature/ticket-system
**Status:** Approved

---

## Overview

Add create, edit, and delete functionality for tickets, following the established form patterns used by Anlagen and Kunden. Tickets support both registered customers/facilities (via FK pickers) and non-registered contacts (via free-text fields).

---

## Scope

**In scope:**
- Server actions: `createTicket`, `updateTicket` (deleteTicket already exists)
- `AnlagePicker` component (new, parallel to `KundePicker`)
- `TicketCreateForm` component and `/tickets/new` page
- `TicketEditForm` component and `/tickets/[id]` page
- Auto-fill contact fields when a Kunde or Anlage is selected
- Internal comments on the edit page (`ref_table = 'tickets'`)
- Note: table row click to `/tickets/[id]` is already implemented in `ticket-table.tsx`

**Out of scope:**
- Ticket scheduling / appointment linking
- File attachments
- Status history / audit log

---

## Data Layer

### Server actions (`lib/actions/tickets.ts`)

Add three new exports alongside the existing `fetchTickets` and `deleteTicket`:

```ts
createTicket(input: CreateTicketInput): Promise<{ success: boolean; id?: number; error?: string }>
updateTicket(id: number, input: UpdateTicketInput): Promise<{ success: boolean; error?: string }>
getKundeContactForTicket(kundenId: number): Promise<KundeContactData | null>
```

`getKundeContactForTicket` is a server action (in the `"use server"` file `lib/actions/tickets.ts`) so client components can call it directly for auto-fill. It queries the `kunden` table and returns the contact-relevant fields.

**`CreateTicketInput` / `UpdateTicketInput` fields** (all optional except `titel`):

| Field | Type | Notes |
|---|---|---|
| `titel` | `string` | Required |
| `beschreibung` | `string \| undefined` | |
| `status` | `TicketStatus` | Default: `'offen'` |
| `prioritaet` | `TicketPriorität` | Default: `'normal'` |
| `kunden_id` | `number \| undefined` | FK to kunden |
| `anlage_id` | `number \| undefined` | FK to anlagen |
| `anlage_name` | `string \| undefined` | Free-text or auto-filled from anlage |
| `vorname` | `string \| undefined` | |
| `nachname` | `string \| undefined` | |
| `email` | `string \| undefined` | |
| `telefonnr` | `string \| undefined` | |
| `strasse` | `string \| undefined` | |
| `hausnr` | `string \| undefined` | |
| `plz` | `string \| undefined` | |
| `ort` | `string \| undefined` | |
| `user_id` | `string \| undefined` | Assigned technician (FK to auth.users) |
| `user_name` | `string \| undefined` | Denormalized name of assigned technician |

`kunden_name` and `anlagen_nr` from `TicketListItem` are joined display fields and must **not** be included in `CreateTicketInput` / `UpdateTicketInput` — they are not columns on the `tickets` table.

The `ticket_nr` field is set by a DB trigger after insert and must not be set by the client.

**`KundeContactData`** (returned by `getKundeContactForTicket`):
```ts
interface KundeContactData {
  nachname?: string;
  vorname?: string;
  email?: string;
  telefonnr?: string;
  strasse?: string;
  hausnr?: string;
  plz?: string;
  ort?: string;
}
```

### Fetch action for AnlagePicker

Add `fetchAnlagenForPicker(search: string)` to `lib/actions/anlagen.ts` — a `"use server"` wrapper that the `AnlagePicker` client component can call. Returns a list of `AnlagePickerResult` objects from `anlagen_details`, filtering by `anlagen_nr`, `ort`, or `anl_typ_bezeichnung`.

### Internal comments support

`interne_anmerkungen` already supports polymorphic records. No schema change needed — the edit form calls `<InternalComments refTable="tickets" refId={ticket.id} />` (same as 'kunden'/'anlagen' usage). `getTicketById` is called directly from the page server component (no action wrapper needed, consistent with how `getAnlageById` is used).

---

## Components

### `AnlagePicker` (`components/dashboard/anlage-picker.tsx`)

New component following the exact pattern of `KundePicker`:
- Dialog with search input
- Calls `fetchAnlagenForPicker(search)` server action
- Props:
  ```ts
  interface AnlagePickerProps {
    value: number | null;
    onChange: (id: number | null, details: AnlagePickerResult | null) => void;
  }

  interface AnlagePickerResult {
    id: number;
    anlagen_nr?: string;
    anl_typ_bezeichnung?: string;  // used as the "name" label in the picker
    kunden_id?: number;
    ort?: string;
  }
  ```
- Display label in the picker trigger: `anlagen_nr` (primary) + `anl_typ_bezeichnung` (secondary, muted)
- On selection: triggers `onChange` with ID and result details for auto-fill
- On clear: triggers `onChange(null, null)`

**Auto-fill from anlage selection:**
- `anlage_name` ← `anl_typ_bezeichnung` from the result (user can still edit it)
- `kunden_id` ← `kunden_id` from the result (only if not already set)
- If `kunden_id` is newly set, trigger the kunden auto-fill flow

### Auto-fill strategy (forms)

**Rule: always overwrite contact fields on picker selection.** No complex per-field tracking. When the user selects a Kunde or Anlage via picker, the form unconditionally replaces all contact fields (vorname, nachname, email, telefonnr, strasse, hausnr, plz, ort) with data from the picked record. This is intentional: the picker is an explicit action, and the user can manually override after.

- Kunde selected → call `getKundeContactForTicket(id)` → overwrite all contact fields
- Anlage selected → set `anlage_name`, set `kunden_id` if empty, then apply kunden contact auto-fill from the linked kunde (same as above)

### `TicketCreateForm` (`components/dashboard/ticket-create-form.tsx`)

Client component (`"use client"`). Props: `techniker: { id: string; name: string }[]`.

**Form state:** object matching `CreateTicketInput` plus local `isSaving: boolean` and `error: string | null`.

**Card layout (2-column grid, same as anlage-create-form):**

```
[ Ticketdaten ]               [ Zuordnung ]
  titel* (full width)           status (Select)
  beschreibung (textarea)       prioritaet (Select)
                                kunden_id (KundePicker)
                                anlage_id (AnlagePicker)
                                anlage_name (text)
                                user_id (Techniker Select)

[ Kontaktperson — full width ]
  vorname         nachname
  email           telefonnr
  strasse + hausnr (proportional, same as anlage form)
  plz + ort
```

**Submit flow:**
1. Validate `titel` is non-empty → display error if missing
2. Set `isSaving = true`, clear error
3. Call `createTicket(form)` server action
4. On success: `router.push('/tickets/' + result.id)`
5. On error: set error string, set `isSaving = false`

**Page header:** Back button → `/tickets`, title "Neues Ticket", Save button (top-right). Error displayed in footer (same pattern as anlage create form).

### `TicketEditForm` (`components/dashboard/ticket-edit-form.tsx`)

Client component. Props:
```ts
interface TicketEditFormProps {
  ticket: TicketListItem;
  techniker: { id: string; name: string }[];
  initialComments: InternalComment[];
}
```

**Additional features vs. create:**
- Page title: `ticket.ticket_nr ?? 'Ticket'`
- Timestamps (created_at, updated_at) displayed below heading in muted text
- "Gespeichert ✓" confirmation that auto-dismisses after 3s (same as anlage-edit-form)
- `InternalComments` section at the bottom of the page

**Submit flow:**
1. Validate `titel` is non-empty
2. Set `isSaving = true`, clear saved/error state
3. Call `updateTicket(ticket.id, form)` server action
4. On success: show "Gespeichert" confirmation, dismiss after 3s
5. On error: set error string, set `isSaving = false`

---

## Pages

### `/tickets/new` (`app/(dashboard)/tickets/new/page.tsx`)

Async server component:
- Fetches `getActiveTechniker()` (reuses existing helper)
- Wraps content in Suspense with a skeleton fallback
- Layout: `absolute inset-0 overflow-y-auto` → inner `div className="p-6 w-full"`

### `/tickets/[id]` (`app/(dashboard)/tickets/[id]/page.tsx`)

Async server component following the Next.js 16 PPR pattern (`params: Promise<{ id: string }>`):
- Awaits params, parses `id` as integer
- Fetches in parallel: `getTicketById(id)`, `getActiveTechniker()`, `getKommentare('tickets', id)`
- Throws `notFound()` if `getTicketById` returns null
- Layout: `absolute inset-0 overflow-y-auto` → inner `div className="p-6 w-full"`
- Renders `<TicketEditForm ticket={...} techniker={...} initialComments={...} />`

---

## File Summary

| Action | File |
|---|---|
| New | `components/dashboard/anlage-picker.tsx` |
| New | `components/dashboard/ticket-create-form.tsx` |
| New | `components/dashboard/ticket-edit-form.tsx` |
| New | `app/(dashboard)/tickets/new/page.tsx` |
| New | `app/(dashboard)/tickets/[id]/page.tsx` |
| Modify | `lib/actions/tickets.ts` — add `createTicket`, `updateTicket`, `getKundeContactForTicket` |
| Modify | `lib/actions/anlagen.ts` — add `fetchAnlagenForPicker` |
