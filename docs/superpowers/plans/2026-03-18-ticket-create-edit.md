# Ticket Create / Edit Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add create and edit pages for tickets with auto-fill from linked customers/facilities, matching the existing Anlagen/Kunden form patterns.

**Architecture:** Full-page forms at `/tickets/new` and `/tickets/[id]`, using card layouts identical to the anlage forms. A new `AnlagePicker` component (parallel to `KundePicker`) enables facility search. Auto-fill overwrites contact fields when a picker selection is made.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase, shadcn/ui (new-york), Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-18-ticket-create-edit-design.md`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `lib/actions/tickets.ts` | Add `createTicket`, `updateTicket`, `getKundeContactForTicket` |
| Modify | `lib/actions/anlagen.ts` | Add `fetchAnlagenForPicker` |
| Create | `components/dashboard/anlage-picker.tsx` | Dialog-based facility search picker |
| Create | `components/dashboard/ticket-create-form.tsx` | Create form client component |
| Create | `app/(dashboard)/tickets/new/page.tsx` | Create page server component |
| Create | `components/dashboard/ticket-edit-form.tsx` | Edit form client component |
| Create | `app/(dashboard)/tickets/[id]/page.tsx` | Edit page server component |

---

## Task 1: Extend `lib/actions/tickets.ts`

**Files:**
- Modify: `lib/actions/tickets.ts`

Add three new exports: `createTicket`, `updateTicket`, `getKundeContactForTicket`.

- [ ] **Step 1: Add the input types and new actions**

Open `lib/actions/tickets.ts`. It currently has `"use server"` at the top, `fetchTickets`, and `deleteTicket`. Add the following **after** the existing imports (add `TicketStatus` and `TicketPriorität` to the type import from `@/lib/types/ticket`):

```typescript
"use server";

import { getTickets } from "@/lib/data/tickets";
import { createClient } from "@/lib/supabase/server";
import type {
  TicketQueryParams,
  TicketQueryResult,
  TicketStatus,
  TicketPriorität,
} from "@/lib/types/ticket";

export interface CreateTicketInput {
  titel: string;
  beschreibung?: string;
  status?: TicketStatus;
  prioritaet?: TicketPriorität;
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
  user_id?: string | null;   // null = explicitly clear the assignment
  user_name?: string | null; // null = explicitly clear the name
}

export type UpdateTicketInput = Partial<CreateTicketInput>;

export interface KundeContactData {
  nachname?: string;
  vorname?: string;
  email?: string;
  telefonnr?: string;
  strasse?: string;
  hausnr?: string;
  plz?: string;
  ort?: string;
}

export async function createTicket(
  input: CreateTicketInput
): Promise<{ success: boolean; id?: number; error?: string }> {
  const supabase = await createClient();

  const row: Record<string, unknown> = {
    status: input.status ?? "offen",
    prioritaet: input.prioritaet ?? "normal",
  };

  // titel is required
  row.titel = input.titel.trim();

  // Optional fields: store non-empty strings, numbers as-is, skip empty strings
  const stringFields: (keyof CreateTicketInput)[] = [
    "beschreibung", "anlage_name", "vorname", "nachname", "email",
    "telefonnr", "strasse", "hausnr", "plz", "ort",
  ];
  for (const key of stringFields) {
    const val = input[key];
    if (typeof val === "string" && val.trim() !== "") {
      row[key] = val.trim();
    }
  }

  if (input.kunden_id != null) row.kunden_id = input.kunden_id;
  if (input.anlage_id != null) row.anlage_id = input.anlage_id;
  if (input.user_id != null) row.user_id = input.user_id;
  if (input.user_name != null) row.user_name = input.user_name;

  const { data, error } = await supabase
    .from("tickets")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("Error creating ticket:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

export async function updateTicket(
  id: number,
  input: UpdateTicketInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.titel !== undefined) row.titel = input.titel.trim();
  if (input.status !== undefined) row.status = input.status;
  if (input.prioritaet !== undefined) row.prioritaet = input.prioritaet;

  const stringFields: (keyof UpdateTicketInput)[] = [
    "beschreibung", "anlage_name", "vorname", "nachname", "email",
    "telefonnr", "strasse", "hausnr", "plz", "ort",
  ];
  for (const key of stringFields) {
    const val = input[key];
    if (val !== undefined) {
      // Store empty strings as NULL (same pattern as updateKunde)
      row[key] = typeof val === "string" && val.trim() === "" ? null : (val as string).trim();
    }
  }

  // FK fields: allow explicit null to clear
  if ("kunden_id" in input) row.kunden_id = input.kunden_id ?? null;
  if ("anlage_id" in input) row.anlage_id = input.anlage_id ?? null;

  // Techniker: user_id is a UUID (not a trimmed string). null = clear the assignment.
  if (input.user_id !== undefined) row.user_id = input.user_id ?? null;
  if (input.user_name !== undefined) row.user_name = input.user_name ?? null;

  const { error } = await supabase.from("tickets").update(row).eq("id", id);

  if (error) {
    console.error("Error updating ticket:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getKundeContactForTicket(
  kundenId: number
): Promise<KundeContactData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kunden")
    .select("nachname, vorname, email, telefonnr, strasse, hausnr, plz, ort")
    .eq("id", kundenId)
    .single();

  if (error || !data) return null;

  return {
    nachname: data.nachname ?? undefined,
    vorname: data.vorname ?? undefined,
    email: data.email ?? undefined,
    telefonnr: data.telefonnr ?? undefined,
    strasse: data.strasse ?? undefined,
    hausnr: data.hausnr ?? undefined,
    plz: data.plz ?? undefined,
    ort: data.ort ?? undefined,
  };
}
```

Keep the existing `fetchTickets` and `deleteTicket` exports unchanged.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | head -40
```

Expected: no type errors related to `tickets.ts`. Fix any TS errors before proceeding.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/tickets.ts
git commit -m "feat(tickets): add createTicket, updateTicket, getKundeContactForTicket actions"
```

---

## Task 2: Add `fetchAnlagenForPicker` to `lib/actions/anlagen.ts`

**Files:**
- Modify: `lib/actions/anlagen.ts`

- [ ] **Step 1: Add the export type and action**

Open `lib/actions/anlagen.ts`. At the **end** of the file, append:

```typescript
export interface AnlagePickerResult {
  id: number;
  anlagen_nr?: string;
  anl_typ_bezeichnung?: string;
  kunden_id?: number;
  ort?: string;
}

export async function fetchAnlagenForPicker(
  search: string
): Promise<AnlagePickerResult[]> {
  const supabase = await createClient();

  let query = supabase
    .from("anlagen_details")
    .select("id, anlagen_nr, anl_typ_bezeichnung, kunden_id, ort")
    .order("anlagen_nr", { ascending: true })
    .limit(20);

  if (search.trim()) {
    const pattern = `%${search.trim()}%`;
    query = query.or(
      [
        `anlagen_nr.ilike.${pattern}`,
        `anl_typ_bezeichnung.ilike.${pattern}`,
        `ort.ilike.${pattern}`,
      ].join(",")
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching anlagen for picker:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as number,
    anlagen_nr: row.anlagen_nr as string | undefined,
    anl_typ_bezeichnung: row.anl_typ_bezeichnung as string | undefined,
    kunden_id: row.kunden_id as number | undefined,
    ort: row.ort as string | undefined,
  }));
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | head -40
```

Expected: no errors in `anlagen.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/anlagen.ts
git commit -m "feat(tickets): add fetchAnlagenForPicker action"
```

---

## Task 3: Create `AnlagePicker` component

**Files:**
- Create: `components/dashboard/anlage-picker.tsx`

This component mirrors `KundePicker` exactly but searches anlagen.

- [ ] **Step 1: Create the file**

```typescript
// components/dashboard/anlage-picker.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  fetchAnlagenForPicker,
  type AnlagePickerResult,
} from "@/lib/actions/anlagen";
import { Search, Building2, X } from "lucide-react";

export interface SelectedAnlage {
  id: number;
  label: string;    // anlagen_nr (primary display)
  sublabel?: string; // anl_typ_bezeichnung + ort (secondary)
}

interface AnlagePickerProps {
  value: number | null;
  onChange: (id: number | null, details: AnlagePickerResult | null) => void;
  initial?: SelectedAnlage;
}

export function AnlagePicker({ value, onChange, initial }: AnlagePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AnlagePickerResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<SelectedAnlage | null>(
    initial ?? null
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsSearching(true);

    const delay = search.trim() ? 300 : 0;
    const timer = setTimeout(() => {
      fetchAnlagenForPicker(search.trim()).then((r) => {
        if (!cancelled) {
          setResults(r);
          setIsSearching(false);
        }
      });
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, open]);

  const handleSelect = (anlage: AnlagePickerResult) => {
    const parts = [anlage.anl_typ_bezeichnung, anlage.ort].filter(Boolean);
    const sel: SelectedAnlage = {
      id: anlage.id,
      label: anlage.anlagen_nr ?? `Anlage #${anlage.id}`,
      sublabel: parts.join(" · ") || undefined,
    };
    setSelected(sel);
    onChange(anlage.id, anlage);
    setOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    setSelected(null);
    onChange(null, null);
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) setSearch("");
  };

  return (
    <>
      {selected ? (
        <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2.5">
          <Building2 className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">{selected.label}</p>
            {selected.sublabel && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {selected.sublabel}
              </p>
            )}
          </div>
          <div className="flex gap-1 shrink-0 ml-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setOpen(true)}
            >
              Ändern
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
              aria-label="Anlage entfernen"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-muted-foreground font-normal h-10"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4 mr-2 shrink-0" />
          Anlage suchen…
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg p-0" aria-describedby={undefined}>
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle>Anlage auswählen</DialogTitle>
          </DialogHeader>

          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Anlagen-Nr., Typ oder Ort suchen…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[360px] border-t">
            {isSearching ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Suche läuft…
              </p>
            ) : results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Keine Anlagen gefunden.
              </p>
            ) : (
              <ul>
                {results.map((a) => {
                  const isActive = a.id === value;
                  const parts = [a.anl_typ_bezeichnung, a.ort].filter(Boolean);
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        className={`w-full text-left px-4 py-2.5 hover:bg-accent transition-colors ${
                          isActive ? "bg-accent" : ""
                        }`}
                        onClick={() => handleSelect(a)}
                      >
                        <p className="text-sm font-medium truncate font-mono">
                          {a.anlagen_nr ?? `Anlage #${a.id}`}
                        </p>
                        {parts.length > 0 && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {parts.join(" · ")}
                          </p>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm build 2>&1 | head -40
```

Expected: no errors in `anlage-picker.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/anlage-picker.tsx
git commit -m "feat(tickets): add AnlagePicker component"
```

---

## Task 4: Create `TicketCreateForm` and `/tickets/new` page

**Files:**
- Create: `components/dashboard/ticket-create-form.tsx`
- Create: `app/(dashboard)/tickets/new/page.tsx`

- [ ] **Step 1: Create the form component**

```typescript
// components/dashboard/ticket-create-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTicket,
  getKundeContactForTicket,
  type CreateTicketInput,
} from "@/lib/actions/tickets";
import { KundePicker } from "@/components/dashboard/kunde-picker";
import {
  AnlagePicker,
  type SelectedAnlage,
} from "@/components/dashboard/anlage-picker";
import type { AnlagePickerResult } from "@/lib/actions/anlagen";
import { Loader2, ArrowLeft } from "lucide-react";

const EMPTY_FORM: CreateTicketInput = {
  titel: "",
  beschreibung: "",
  status: "offen",
  prioritaet: "normal",
  kunden_id: undefined,
  anlage_id: undefined,
  anlage_name: "",
  vorname: "",
  nachname: "",
  email: "",
  telefonnr: "",
  strasse: "",
  hausnr: "",
  plz: "",
  ort: "",
  user_id: undefined,
  user_name: undefined,
};

interface TicketCreateFormProps {
  techniker: { id: string; name: string }[];
}

export function TicketCreateForm({ techniker }: TicketCreateFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<CreateTicketInput>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track initial values for pickers (always null on create)
  const [initialAnlage] = useState<SelectedAnlage | undefined>(undefined);

  const set = (field: keyof CreateTicketInput, value: string | number | undefined) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleKundeChange = async (id: number | null) => {
    set("kunden_id", id ?? undefined);
    if (id == null) return;
    const contact = await getKundeContactForTicket(id);
    if (contact) {
      setForm((prev) => ({
        ...prev,
        kunden_id: id,
        vorname: contact.vorname ?? "",
        nachname: contact.nachname ?? "",
        email: contact.email ?? "",
        telefonnr: contact.telefonnr ?? "",
        strasse: contact.strasse ?? "",
        hausnr: contact.hausnr ?? "",
        plz: contact.plz ?? "",
        ort: contact.ort ?? "",
      }));
    }
  };

  const handleAnlageChange = async (
    id: number | null,
    details: AnlagePickerResult | null
  ) => {
    if (id == null || details == null) {
      set("anlage_id", undefined);
      return;
    }
    const newKundenId = details.kunden_id;
    // Read kunden_id from current form state BEFORE any setForm calls (avoids stale closure)
    const effectiveKundeId = form.kunden_id ?? newKundenId;

    if (effectiveKundeId) {
      const contact = await getKundeContactForTicket(effectiveKundeId);
      setForm((prev) => ({
        ...prev,
        anlage_id: id,
        anlage_name: details.anl_typ_bezeichnung ?? "",
        kunden_id: prev.kunden_id ?? newKundenId,
        ...(contact ? {
          vorname: contact.vorname ?? "",
          nachname: contact.nachname ?? "",
          email: contact.email ?? "",
          telefonnr: contact.telefonnr ?? "",
          strasse: contact.strasse ?? "",
          hausnr: contact.hausnr ?? "",
          plz: contact.plz ?? "",
          ort: contact.ort ?? "",
        } : {}),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        anlage_id: id,
        anlage_name: details.anl_typ_bezeichnung ?? "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titel.trim()) {
      setError("Bitte einen Titel angeben.");
      return;
    }
    setIsSaving(true);
    setError(null);

    const result = await createTicket(form);
    if (!result.success) {
      setIsSaving(false);
      setError(result.error ?? "Unbekannter Fehler.");
      return;
    }
    router.push(`/tickets/${result.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href="/tickets">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Link>
        </Button>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Neues Ticket</h1>
          <Button type="submit" disabled={isSaving} className="shrink-0">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Ticketdaten ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ticketdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="space-y-1.5">
              <Label htmlFor="titel">
                Titel <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titel"
                value={form.titel}
                onChange={(e) => set("titel", e.target.value)}
                placeholder="z. B. Anlage läuft nicht"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="beschreibung">Beschreibung</Label>
              <Textarea
                id="beschreibung"
                value={form.beschreibung ?? ""}
                onChange={(e) => set("beschreibung", e.target.value)}
                rows={4}
                placeholder="Details zum Problem…"
              />
            </div>

          </CardContent>
        </Card>

        {/* ── Zuordnung ────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zuordnung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status ?? "offen"}
                  onValueChange={(v) => set("status", v)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offen">Offen</SelectItem>
                    <SelectItem value="eingeplant">Eingeplant</SelectItem>
                    <SelectItem value="gelöst">Gelöst</SelectItem>
                    <SelectItem value="geschlossen">Geschlossen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prioritaet">Priorität</Label>
                <Select
                  value={form.prioritaet ?? "normal"}
                  onValueChange={(v) => set("prioritaet", v)}
                >
                  <SelectTrigger id="prioritaet">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="hoch">Hoch</SelectItem>
                    <SelectItem value="dringend">Dringend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Kunde</Label>
              <KundePicker
                value={form.kunden_id ?? null}
                onChange={handleKundeChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Anlage</Label>
              <AnlagePicker
                value={form.anlage_id ?? null}
                onChange={handleAnlageChange}
                initial={initialAnlage}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="anlage_name">Anlagenbezeichnung</Label>
              <Input
                id="anlage_name"
                value={form.anlage_name ?? ""}
                onChange={(e) => set("anlage_name", e.target.value)}
                placeholder="z. B. Kleinkläranlage Typ X"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="techniker">Techniker</Label>
              <Select
                value={form.user_id ?? "none"}
                onValueChange={(v) => {
                  if (v === "none") {
                    setForm((prev) => ({ ...prev, user_id: null, user_name: null }));
                  } else {
                    const t = techniker.find((t) => t.id === v);
                    setForm((prev) => ({ ...prev, user_id: v, user_name: t?.name ?? null }));
                  }
                }}
              >
                <SelectTrigger id="techniker">
                  <SelectValue placeholder="Techniker auswählen…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Kein Techniker —</SelectItem>
                  {techniker.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>

        {/* ── Kontaktperson ────────────────────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Kontaktperson</CardTitle>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefonnr">Telefon</Label>
                <Input
                  id="telefonnr"
                  value={form.telefonnr ?? ""}
                  onChange={(e) => set("telefonnr", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_100px] gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="strasse">Straße</Label>
                <Input
                  id="strasse"
                  value={form.strasse ?? ""}
                  onChange={(e) => set("strasse", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hausnr">Nr.</Label>
                <Input
                  id="hausnr"
                  value={form.hausnr ?? ""}
                  onChange={(e) => set("hausnr", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-[90px_1fr] gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="plz">PLZ</Label>
                <Input
                  id="plz"
                  value={form.plz ?? ""}
                  onChange={(e) => set("plz", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ort">Ort</Label>
                <Input
                  id="ort"
                  value={form.ort ?? ""}
                  onChange={(e) => set("ort", e.target.value)}
                />
              </div>
            </div>

          </CardContent>
        </Card>

      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-8">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && <span />}
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Speichern
        </Button>
      </div>

    </form>
  );
}
```

- [ ] **Step 2: Create the page**

```typescript
// app/(dashboard)/tickets/new/page.tsx
import { Suspense } from "react";
import { getActiveTechniker } from "@/lib/data/anlagen";
import { TicketCreateForm } from "@/components/dashboard/ticket-create-form";
import { Skeleton } from "@/components/ui/skeleton";

async function TicketCreateData() {
  const techniker = await getActiveTechniker();
  return <TicketCreateForm techniker={techniker} />;
}

function TicketCreateSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl col-span-2" />
      </div>
    </div>
  );
}

export default function NewTicketPage() {
  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 w-full">
        <Suspense fallback={<TicketCreateSkeleton />}>
          <TicketCreateData />
        </Suspense>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript and check the shadcn Textarea component is available**

Check if Textarea is installed:
```bash
ls components/ui/textarea.tsx 2>/dev/null && echo "exists" || echo "missing"
```

If missing, install it:
```bash
npx shadcn@latest add textarea
```

Then build:
```bash
pnpm build 2>&1 | head -60
```

Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Start the dev server (`pnpm dev`) and navigate to `http://localhost:3000/tickets/new`.

Verify:
- Page loads with back button, "Neues Ticket" title, Save button
- Two cards (Ticketdaten, Zuordnung) + Kontaktperson full-width card
- Saving with empty titel shows "Bitte einen Titel angeben."
- Selecting a Kunde via picker fills contact fields
- Selecting an Anlage via picker fills anlage_name + sets Kunde + fills contact fields
- Saving a valid form redirects to `/tickets/<id>` (which shows 404 until Task 6)

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/ticket-create-form.tsx app/(dashboard)/tickets/new/page.tsx
git commit -m "feat(tickets): add ticket create form and page"
```

---

## Task 5: Create `TicketEditForm`

**Files:**
- Create: `components/dashboard/ticket-edit-form.tsx`

- [ ] **Step 1: Create the file**

```typescript
// components/dashboard/ticket-edit-form.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateTicket,
  getKundeContactForTicket,
  type UpdateTicketInput,
} from "@/lib/actions/tickets";
import { KundePicker } from "@/components/dashboard/kunde-picker";
import { AnlagePicker } from "@/components/dashboard/anlage-picker";
import type { AnlagePickerResult } from "@/lib/actions/anlagen";
import { InternalComments } from "@/components/dashboard/internal-comments";
import type { InternalComment } from "@/lib/types/kommentar";
import type { TicketListItem } from "@/lib/types/ticket";
import { Loader2, Check, ArrowLeft } from "lucide-react";

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

interface TicketEditFormProps {
  ticket: TicketListItem;
  techniker: { id: string; name: string }[];
  initialComments: InternalComment[];
}

export function TicketEditForm({
  ticket,
  techniker,
  initialComments,
}: TicketEditFormProps) {
  const [form, setForm] = useState<UpdateTicketInput>({
    titel: ticket.titel ?? "",
    beschreibung: ticket.beschreibung ?? "",
    status: ticket.status,
    prioritaet: ticket.prioritaet,
    kunden_id: ticket.kunden_id,
    anlage_id: ticket.anlage_id,
    anlage_name: ticket.anlage_name ?? "",
    vorname: ticket.vorname ?? "",
    nachname: ticket.nachname ?? "",
    email: ticket.email ?? "",
    telefonnr: ticket.telefonnr ?? "",
    strasse: ticket.strasse ?? "",
    hausnr: ticket.hausnr ?? "",
    plz: ticket.plz ?? "",
    ort: ticket.ort ?? "",
    user_id: ticket.user_id,
    user_name: ticket.user_name,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof UpdateTicketInput, value: string | number | undefined) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleKundeChange = async (id: number | null) => {
    set("kunden_id", id ?? undefined);
    if (id == null) return;
    const contact = await getKundeContactForTicket(id);
    if (contact) {
      setForm((prev) => ({
        ...prev,
        kunden_id: id,
        vorname: contact.vorname ?? "",
        nachname: contact.nachname ?? "",
        email: contact.email ?? "",
        telefonnr: contact.telefonnr ?? "",
        strasse: contact.strasse ?? "",
        hausnr: contact.hausnr ?? "",
        plz: contact.plz ?? "",
        ort: contact.ort ?? "",
      }));
    }
  };

  const handleAnlageChange = async (
    id: number | null,
    details: AnlagePickerResult | null
  ) => {
    if (id == null || details == null) {
      set("anlage_id", undefined);
      return;
    }
    const newKundenId = details.kunden_id;
    // Read kunden_id from current form state BEFORE any setForm calls (avoids stale closure)
    const effectiveKundeId = form.kunden_id ?? newKundenId;

    if (effectiveKundeId) {
      const contact = await getKundeContactForTicket(effectiveKundeId);
      setForm((prev) => ({
        ...prev,
        anlage_id: id,
        anlage_name: details.anl_typ_bezeichnung ?? "",
        kunden_id: prev.kunden_id ?? newKundenId,
        ...(contact ? {
          vorname: contact.vorname ?? "",
          nachname: contact.nachname ?? "",
          email: contact.email ?? "",
          telefonnr: contact.telefonnr ?? "",
          strasse: contact.strasse ?? "",
          hausnr: contact.hausnr ?? "",
          plz: contact.plz ?? "",
          ort: contact.ort ?? "",
        } : {}),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        anlage_id: id,
        anlage_name: details.anl_typ_bezeichnung ?? "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titel?.trim()) {
      setError("Bitte einen Titel angeben.");
      return;
    }
    setIsSaving(true);
    setSaved(false);
    setError(null);

    const result = await updateTicket(ticket.id, form);
    setIsSaving(false);
    if (!result.success) {
      setError(result.error ?? "Unbekannter Fehler.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  // Build initial SelectedAnlage for the picker (if ticket has an anlage)
  const initialAnlage = ticket.anlage_id
    ? {
        id: ticket.anlage_id,
        label: ticket.anlagen_nr ?? `Anlage #${ticket.anlage_id}`,
        sublabel: ticket.anlage_name || undefined,
      }
    : undefined;

  // Build initial SelectedKunde for the picker (if ticket has a kunde)
  const initialKunde =
    ticket.kunden_id && ticket.kunden_name
      ? {
          id: ticket.kunden_id,
          name: ticket.kunden_name,
          address: "",
        }
      : undefined;

  const displayTitle = ticket.ticket_nr ?? "Ticket";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href="/tickets">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Link>
        </Button>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{displayTitle}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Erstellt: {formatDateTime(ticket.created_at)}
              {ticket.updated_at && (
                <> · Geändert: {formatDateTime(ticket.updated_at)}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {saved && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-success" />
                Gespeichert
              </span>
            )}
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Ticketdaten ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ticketdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="space-y-1.5">
              <Label htmlFor="titel">
                Titel <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titel"
                value={form.titel ?? ""}
                onChange={(e) => set("titel", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="beschreibung">Beschreibung</Label>
              <Textarea
                id="beschreibung"
                value={form.beschreibung ?? ""}
                onChange={(e) => set("beschreibung", e.target.value)}
                rows={4}
              />
            </div>

          </CardContent>
        </Card>

        {/* ── Zuordnung ────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zuordnung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status ?? "offen"}
                  onValueChange={(v) => set("status", v)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offen">Offen</SelectItem>
                    <SelectItem value="eingeplant">Eingeplant</SelectItem>
                    <SelectItem value="gelöst">Gelöst</SelectItem>
                    <SelectItem value="geschlossen">Geschlossen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prioritaet">Priorität</Label>
                <Select
                  value={form.prioritaet ?? "normal"}
                  onValueChange={(v) => set("prioritaet", v)}
                >
                  <SelectTrigger id="prioritaet">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="hoch">Hoch</SelectItem>
                    <SelectItem value="dringend">Dringend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Kunde</Label>
              <KundePicker
                value={form.kunden_id ?? null}
                onChange={handleKundeChange}
                initial={initialKunde}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Anlage</Label>
              <AnlagePicker
                value={form.anlage_id ?? null}
                onChange={handleAnlageChange}
                initial={initialAnlage}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="anlage_name">Anlagenbezeichnung</Label>
              <Input
                id="anlage_name"
                value={form.anlage_name ?? ""}
                onChange={(e) => set("anlage_name", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="techniker">Techniker</Label>
              <Select
                value={form.user_id ?? "none"}
                onValueChange={(v) => {
                  if (v === "none") {
                    setForm((prev) => ({ ...prev, user_id: null, user_name: null }));
                  } else {
                    const t = techniker.find((t) => t.id === v);
                    setForm((prev) => ({ ...prev, user_id: v, user_name: t?.name ?? null }));
                  }
                }}
              >
                <SelectTrigger id="techniker">
                  <SelectValue placeholder="Techniker auswählen…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Kein Techniker —</SelectItem>
                  {techniker.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>

        {/* ── Kontaktperson ────────────────────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Kontaktperson</CardTitle>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefonnr">Telefon</Label>
                <Input
                  id="telefonnr"
                  value={form.telefonnr ?? ""}
                  onChange={(e) => set("telefonnr", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_100px] gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="strasse">Straße</Label>
                <Input
                  id="strasse"
                  value={form.strasse ?? ""}
                  onChange={(e) => set("strasse", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hausnr">Nr.</Label>
                <Input
                  id="hausnr"
                  value={form.hausnr ?? ""}
                  onChange={(e) => set("hausnr", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-[90px_1fr] gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="plz">PLZ</Label>
                <Input
                  id="plz"
                  value={form.plz ?? ""}
                  onChange={(e) => set("plz", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ort">Ort</Label>
                <Input
                  id="ort"
                  value={form.ort ?? ""}
                  onChange={(e) => set("ort", e.target.value)}
                />
              </div>
            </div>

          </CardContent>
        </Card>

      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-8">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && <span />}
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Speichern
        </Button>
      </div>

      {/* ── Interne Anmerkungen ──────────────────────────────────── */}
      <InternalComments
        refTable="tickets"
        refId={ticket.id}
        initialComments={initialComments}
      />

    </form>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm build 2>&1 | head -60
```

Expected: no errors in `ticket-edit-form.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/ticket-edit-form.tsx
git commit -m "feat(tickets): add ticket edit form component"
```

---

## Task 6: Create `/tickets/[id]` edit page

**Files:**
- Create: `app/(dashboard)/tickets/[id]/page.tsx`

- [ ] **Step 1: Check the `getInternalComments` import path**

```bash
grep -n "export.*getInternalComments" lib/data/kommentare.ts
```

Expected: confirms the function name and path. If the export is named differently, adjust the import in the page below.

- [ ] **Step 2: Create the page**

```typescript
// app/(dashboard)/tickets/[id]/page.tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTicketById } from "@/lib/data/tickets";
import { getActiveTechniker } from "@/lib/data/anlagen";
import { getInternalComments } from "@/lib/data/kommentare";
import { TicketEditForm } from "@/components/dashboard/ticket-edit-form";
import { Skeleton } from "@/components/ui/skeleton";

async function TicketDetail({ id }: { id: number }) {
  const [ticket, techniker, initialComments] = await Promise.all([
    getTicketById(id),
    getActiveTechniker(),
    getInternalComments("tickets", id),
  ]);

  if (!ticket) notFound();

  return (
    <TicketEditForm
      ticket={ticket}
      techniker={techniker}
      initialComments={initialComments}
    />
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl col-span-2" />
      </div>
    </div>
  );
}

async function TicketDetailResolver({
  idPromise,
}: {
  idPromise: Promise<number>;
}) {
  const id = await idPromise;
  return <TicketDetail id={id} />;
}

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const idPromise = params.then(({ id }) => {
    const n = parseInt(id, 10);
    if (isNaN(n)) notFound();
    return n;
  });

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 w-full">
        <Suspense fallback={<TicketDetailSkeleton />}>
          <TicketDetailResolver idPromise={idPromise} />
        </Suspense>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify full build**

```bash
pnpm build 2>&1 | head -60
```

Expected: clean build, no TypeScript or lint errors.

- [ ] **Step 4: Manual smoke test**

With `pnpm dev` running, test end-to-end:

1. Navigate to `/tickets` — click "Neues Ticket"
2. Fill in Titel, pick a Kunde, verify contact fields auto-fill
3. Pick an Anlage, verify `anlage_name` auto-fills
4. Save — should redirect to `/tickets/<id>`
5. On the edit page: verify all fields are pre-populated
6. Change the status, save — verify "Gespeichert ✓" appears and fades
7. Click a ticket row in `/tickets` — verify it navigates to the edit page
8. Add an internal comment — verify it saves and appears

- [ ] **Step 5: Commit**

```bash
git add app/(dashboard)/tickets/[id]/page.tsx
git commit -m "feat(tickets): add ticket edit page"
```
