# Ticket System — Data Table Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the ticket system data table — database schema, types, data layer, server actions, table UI, and nav entry on the `feature/ticket-system` branch.

**Architecture:** Follows the exact customer (kunden) feature pattern end-to-end: Supabase view → typed data layer → server actions → server wrapper component → client table component → Next.js page. A new top-level "Tickets" nav entry routes to `/tickets`.

**Tech Stack:** Next.js 15 App Router, React 19 server + client components, Supabase, TypeScript, shadcn/ui Table, Tailwind CSS, lucide-react.

---

## Files

| Action | File |
|--------|------|
| Create | `lib/types/ticket.ts` |
| Create | `lib/data/tickets.ts` |
| Create | `lib/actions/tickets.ts` |
| Create | `components/dashboard/ticket-table.tsx` |
| Create | `components/dashboard/ticket-table-server.tsx` |
| Create | `app/(dashboard)/tickets/page.tsx` |
| Create | `app/(dashboard)/tickets/loading.tsx` |
| Modify | `components/dashboard/nav-items.tsx` |

Database: SQL run via Supabase MCP tool or Supabase dashboard (no migrations folder in repo).

Reference files (read before implementing):
- `components/dashboard/customer-table.tsx` — table pattern
- `components/dashboard/customer-table-server.tsx` — server wrapper pattern
- `app/(dashboard)/master-data/customers/page.tsx` — page pattern
- `lib/data/customers.ts` — data layer pattern
- `lib/actions/customers.ts` — server action pattern

---

## Chunk 1: Database + Types

### Task 1: Create Supabase database schema

**No files to create** — SQL is run directly in Supabase.

- [ ] **Step 1: Run the tickets table SQL**

In Supabase SQL editor (project `nsrwtwsagmtmkcxpcpzo`) or via Supabase MCP `execute_sql`, run:

```sql
CREATE TABLE public.tickets (
  id          BIGSERIAL PRIMARY KEY,
  ticket_nr   TEXT UNIQUE,
  titel       TEXT NOT NULL,
  beschreibung TEXT,
  status      TEXT NOT NULL DEFAULT 'offen'
                CHECK (status IN ('offen','eingeplant','gelöst','geschlossen')),
  prioritaet  TEXT NOT NULL DEFAULT 'normal'
                CHECK (prioritaet IN ('normal','hoch','dringend')),
  kunden_id   BIGINT REFERENCES public.kunden(id) ON DELETE SET NULL,
  anlage_id   BIGINT REFERENCES public.anlagen(id) ON DELETE SET NULL,
  anlage_name TEXT,
  vorname     TEXT,
  nachname    TEXT,
  email       TEXT,
  telefonnr   TEXT,
  strasse     TEXT,
  hausnr      TEXT,
  plz         TEXT,
  ort         TEXT,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ
);
```

- [ ] **Step 2: Create the ticket_nr trigger**

Note: must be `AFTER INSERT` — with `BIGSERIAL`, `NEW.id` is `NULL` inside a `BEFORE INSERT` trigger (the sequence fires during the INSERT, not before it). Use `UPDATE` in an `AFTER INSERT` trigger instead.

```sql
CREATE OR REPLACE FUNCTION generate_ticket_nr()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tickets
  SET ticket_nr = 'TK-' || EXTRACT(YEAR FROM now())::TEXT
                  || '-' || LPAD(NEW.id::TEXT, 4, '0')
  WHERE id = NEW.id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_nr
  AFTER INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_nr();
```

- [ ] **Step 3: Create the tickets_details view**

Note: `kunden_name` uses `firma` first (if non-empty), then falls back to `vorname + nachname`. This is intentionally richer than the spec's simpler `nachname, vorname` formula because the `kunden` table has a `firma` field that should take precedence for business customers.

```sql
CREATE OR REPLACE VIEW public.tickets_details AS
SELECT
  t.*,
  COALESCE(
    NULLIF(TRIM(k.firma), ''),
    TRIM(COALESCE(k.vorname || ' ', '') || COALESCE(k.nachname, ''))
  ) AS kunden_name,
  a.anlagen_nr
FROM public.tickets t
LEFT JOIN public.kunden k ON k.id = t.kunden_id
LEFT JOIN public.anlagen a ON a.id = t.anlage_id;
```

- [ ] **Step 4: Verify with a test insert + select**

```sql
INSERT INTO public.tickets (titel, status, prioritaet)
VALUES ('Test-Ticket', 'offen', 'normal');

SELECT id, ticket_nr, titel, status FROM public.tickets_details;
-- Expected: one row with ticket_nr = 'TK-2026-0001'

DELETE FROM public.tickets WHERE titel = 'Test-Ticket';
```

---

### Task 2: TypeScript types

**Files:**
- Create: `lib/types/ticket.ts`

- [ ] **Step 1: Create the types file**

```ts
export type TicketStatus = "offen" | "eingeplant" | "gelöst" | "geschlossen";
export type TicketPriorität = "normal" | "hoch" | "dringend";
export type TicketSortField = "ticket_nr" | "titel" | "status" | "prioritaet" | "created_at";
export type SortDirection = "asc" | "desc";

export interface Ticket {
  id: number;
  ticket_nr?: string;  // nullable in DB (AFTER INSERT trigger sets it); display as ticket_nr ?? "—"
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

// Extended with joined display fields from tickets_details view
export interface TicketListItem extends Ticket {
  kunden_name?: string;  // from kunden join (firma or nachname+vorname)
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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd D:/git/awadi-web && pnpm build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors related to `lib/types/ticket.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/types/ticket.ts
git commit -m "feat(tickets): add TypeScript types"
```

---

## Chunk 2: Data Layer + Server Actions

### Task 3: Data functions

**Files:**
- Create: `lib/data/tickets.ts`

- [ ] **Step 1: Create the data file**

```ts
import { createClient } from "@/lib/supabase/server";
import type {
  TicketListItem,
  TicketQueryParams,
  TicketQueryResult,
} from "@/lib/types/ticket";

function mapRowToTicket(row: Record<string, unknown>): TicketListItem {
  return {
    id: row.id as number,
    ticket_nr: row.ticket_nr as string | undefined,
    titel: row.titel as string,
    beschreibung: row.beschreibung as string | undefined,
    status: row.status as TicketListItem["status"],
    prioritaet: row.prioritaet as TicketListItem["prioritaet"],
    kunden_id: row.kunden_id as number | undefined,
    anlage_id: row.anlage_id as number | undefined,
    anlage_name: row.anlage_name as string | undefined,
    vorname: row.vorname as string | undefined,
    nachname: row.nachname as string | undefined,
    email: row.email as string | undefined,
    telefonnr: row.telefonnr as string | undefined,
    strasse: row.strasse as string | undefined,
    hausnr: row.hausnr as string | undefined,
    plz: row.plz as string | undefined,
    ort: row.ort as string | undefined,
    user_id: row.user_id as string | undefined,
    user_name: row.user_name as string | undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string | undefined,
    kunden_name: row.kunden_name as string | undefined,
    anlagen_nr: row.anlagen_nr as string | undefined,
  };
}

export async function getTickets(
  params: TicketQueryParams = {}
): Promise<TicketQueryResult> {
  const {
    search,
    filterStatus = "all",
    filterPriorität = "all",
    sortField = "created_at",
    sortDirection = "desc",
    page = 1,
    pageSize = 14,
  } = params;

  const supabase = await createClient();
  let query = supabase
    .from("tickets_details")
    .select("*", { count: "exact" });

  if (search?.trim()) {
    const pattern = `%${search.trim()}%`;
    query = query.or(
      [
        `ticket_nr.ilike.${pattern}`,
        `titel.ilike.${pattern}`,
        `nachname.ilike.${pattern}`,
        `vorname.ilike.${pattern}`,
        `email.ilike.${pattern}`,
        `kunden_name.ilike.${pattern}`,
        `anlagen_nr.ilike.${pattern}`,
        `anlage_name.ilike.${pattern}`,
      ].join(",")
    );
  }

  if (filterStatus !== "all") {
    query = query.eq("status", filterStatus);
  }

  if (filterPriorität !== "all") {
    query = query.eq("prioritaet", filterPriorität);
  }

  query = query.order(sortField, { ascending: sortDirection === "asc" });

  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error("Error fetching tickets:", error);
    return { data: [], totalCount: 0 };
  }

  return {
    data: (data ?? []).map(mapRowToTicket),
    totalCount: count ?? 0,
  };
}

export async function getTicketById(id: number): Promise<TicketListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets_details")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return mapRowToTicket(data);
}

export async function getTicketCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd D:/git/awadi-web && pnpm build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/data/tickets.ts
git commit -m "feat(tickets): add data layer"
```

---

### Task 4: Server actions

**Files:**
- Create: `lib/actions/tickets.ts`

- [ ] **Step 1: Create the actions file**

```ts
"use server";

import { getTickets } from "@/lib/data/tickets";
import { createClient } from "@/lib/supabase/server";
import type { TicketQueryParams, TicketQueryResult } from "@/lib/types/ticket";

export async function fetchTickets(
  params: TicketQueryParams = {}
): Promise<TicketQueryResult> {
  return getTickets(params);
}

export async function deleteTicket(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("tickets").delete().eq("id", id);
  if (error) {
    return { success: false, error: "Ticket konnte nicht gelöscht werden." };
  }
  return { success: true };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd D:/git/awadi-web && pnpm build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/tickets.ts
git commit -m "feat(tickets): add server actions"
```

---

## Chunk 3: UI Components + Routing

### Task 5: Ticket table client component

**Files:**
- Create: `components/dashboard/ticket-table.tsx`

- [ ] **Step 1: Create the client table component**

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  TicketListItem,
  TicketStatus,
  TicketPriorität,
  TicketSortField,
  SortDirection,
} from "@/lib/types/ticket";
import { fetchTickets, deleteTicket } from "@/lib/actions/tickets";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

const PAGE_SIZE = 14;
const ROW_HEIGHT = "h-[46px]";
const COLSPAN = 9;

// ── Badge helpers ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TicketStatus }) {
  const config: Record<TicketStatus, { label: string; className: string }> = {
    offen:       { label: "Offen",       className: "bg-info/15 text-info" },
    eingeplant:  { label: "Eingeplant",  className: "bg-warning/15 text-warning" },
    "gelöst":    { label: "Gelöst",      className: "bg-success/15 text-success" },
    geschlossen: { label: "Geschlossen", className: "bg-muted text-muted-foreground" },
  };
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function PrioritätBadge({ priorität }: { priorität: TicketPriorität }) {
  const config: Record<TicketPriorität, { label: string; className: string }> = {
    normal:   { label: "Normal",   className: "bg-muted text-muted-foreground" },
    hoch:     { label: "Hoch",     className: "bg-warning/15 text-warning" },
    dringend: { label: "Dringend", className: "bg-destructive/15 text-destructive" },
  };
  const { label, className } = config[priorität];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface TicketTableProps {
  initialData: TicketListItem[];
  initialCount: number;
}

export function TicketTable({ initialData, initialCount }: TicketTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [sortField, setSortField] = useState<TicketSortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("all");
  const [filterPriorität, setFilterPriorität] = useState<TicketPriorität | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [tickets, setTickets] = useState<TicketListItem[]>(initialData);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const router = useRouter();
  const isInitialRender = useRef(true);

  const handleSearch = () => {
    setActiveSearch(searchQuery);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSearchQuery("");
    setActiveSearch("");
    setCurrentPage(1);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDeleteError(null);
    setPendingDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeleteId === null) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setDeletingId(id);
    const result = await deleteTicket(id);
    if (result.success) {
      setTickets((prev) => prev.filter((t) => t.id !== id));
      setTotalCount((c) => c - 1);
    } else {
      setDeleteError(result.error ?? "Löschen fehlgeschlagen.");
    }
    setDeletingId(null);
  };

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetchTickets({
      search: activeSearch,
      filterStatus,
      filterPriorität,
      sortField,
      sortDirection,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }).then((result) => {
      if (cancelled) return;
      setTickets(result.data);
      setTotalCount(result.totalCount);
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [activeSearch, filterStatus, filterPriorität, sortField, sortDirection, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const fillerCount = Math.max(0, PAGE_SIZE - tickets.length);

  const handleSort = (field: TicketSortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: TicketSortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />;
    return sortDirection === "asc"
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Confirm delete dialog */}
      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Ticket löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Vorgang kann nicht rückgängig gemacht werden. Das Ticket
              wird dauerhaft aus der Datenbank entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error dialog */}
      <AlertDialog
        open={deleteError !== null}
        onOpenChange={(open) => { if (!open) setDeleteError(null); }}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Löschen fehlgeschlagen</AlertDialogTitle>
            <AlertDialogDescription>{deleteError}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDeleteError(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0 pb-4 gap-3">
        {/* Left: search + pagination */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tickets suchen…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-8 pr-8 w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                aria-label="Suche löschen"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={handleSearch}>Suchen</Button>

          {totalPages > 1 && (
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums px-1">
                Seite <b>{currentPage}</b> von <b>{totalPages}</b>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Right: filters + new */}
        <div className="flex items-center gap-2">
          <Select
            value={filterStatus}
            onValueChange={(v) => {
              setFilterStatus(v as TicketStatus | "all");
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="offen">Offen</SelectItem>
              <SelectItem value="eingeplant">Eingeplant</SelectItem>
              <SelectItem value="gelöst">Gelöst</SelectItem>
              <SelectItem value="geschlossen">Geschlossen</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterPriorität}
            onValueChange={(v) => {
              setFilterPriorität(v as TicketPriorität | "all");
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Prioritäten</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="hoch">Hoch</SelectItem>
              <SelectItem value="dringend">Dringend</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => router.push("/tickets/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Neues Ticket
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-auto flex-1 min-h-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px]">
                <button
                  onClick={() => handleSort("ticket_nr")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Ticket-Nr.
                  <SortIcon field="ticket_nr" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("titel")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Titel
                  <SortIcon field="titel" />
                </button>
              </TableHead>
              <TableHead className="w-[120px]">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Status
                  <SortIcon field="status" />
                </button>
              </TableHead>
              <TableHead className="w-[110px]">
                <button
                  onClick={() => handleSort("prioritaet")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Priorität
                  <SortIcon field="prioritaet" />
                </button>
              </TableHead>
              <TableHead>Kontakt</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Anlage</TableHead>
              <TableHead className="w-[120px]">
                <button
                  onClick={() => handleSort("created_at")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Erstellt am
                  <SortIcon field="created_at" />
                </button>
              </TableHead>
              <TableHead className="w-[90px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRow key={`sk-${i}`} className={ROW_HEIGHT}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : tickets.length === 0 ? (
              <>
                <TableRow className={ROW_HEIGHT}>
                  <TableCell
                    colSpan={COLSPAN}
                    className="text-center text-muted-foreground"
                  >
                    Keine Tickets gefunden.
                  </TableCell>
                </TableRow>
                {Array.from({ length: PAGE_SIZE - 1 }).map((_, i) => (
                  <TableRow
                    key={`filler-${i}`}
                    className={`${ROW_HEIGHT} border-b-0 hover:bg-transparent`}
                  >
                    <TableCell colSpan={COLSPAN} className="p-0" />
                  </TableRow>
                ))}
              </>
            ) : (
              <>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className={`${ROW_HEIGHT} cursor-pointer`}
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      {ticket.ticket_nr ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">{ticket.titel}</TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell>
                      <PrioritätBadge priorität={ticket.prioritaet} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ticket.kunden_name ??
                        ([ticket.vorname, ticket.nachname]
                          .filter(Boolean)
                          .join(" ") || "—")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ticket.email ? (
                        <a
                          href={`mailto:${ticket.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline"
                        >
                          {ticket.email}
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ticket.anlagen_nr ?? ticket.anlage_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingId === ticket.id}
                        onClick={(e) => handleDeleteClick(e, ticket.id)}
                      >
                        Löschen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {Array.from({ length: fillerCount }).map((_, i) => (
                  <TableRow
                    key={`filler-${i}`}
                    className={`${ROW_HEIGHT} border-b-0 hover:bg-transparent`}
                  >
                    <TableCell colSpan={COLSPAN} className="p-0" />
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd D:/git/awadi-web && pnpm build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/ticket-table.tsx
git commit -m "feat(tickets): add ticket table client component"
```

---

### Task 6: Server wrapper, page, loading, and nav

**Files:**
- Create: `components/dashboard/ticket-table-server.tsx`
- Create: `app/(dashboard)/tickets/page.tsx`
- Create: `app/(dashboard)/tickets/loading.tsx`
- Modify: `components/dashboard/nav-items.tsx`

- [ ] **Step 1: Create the server wrapper component**

Note: `result.totalCount` already comes from the `count: "exact"` query in `getTickets()` — no need for a separate `getTicketCount()` call here. Using both would cause a redundant DB round-trip and the two counts could diverge.

```tsx
import { getTickets } from "@/lib/data/tickets";
import { TicketTable } from "./ticket-table";

export async function TicketPageContent() {
  const result = await getTickets();

  return (
    <>
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">
          Tickets ({result.totalCount.toLocaleString("de-DE")})
        </h1>
        <p className="text-muted-foreground">
          Verwalten Sie eingehende Serviceanfragen und Störungsmeldungen.
        </p>
      </div>

      <TicketTable
        initialData={result.data}
        initialCount={result.totalCount}
      />
    </>
  );
}
```

- [ ] **Step 2: Create the page**

```tsx
import { Suspense } from "react";
import { TicketPageContent } from "@/components/dashboard/ticket-table-server";
import { Skeleton } from "@/components/ui/skeleton";

export default function TicketsPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 gap-4">
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-[600px] w-full rounded-md border" />
          </div>
        }
      >
        <TicketPageContent />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 3: Create loading.tsx for the tickets route**

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-[600px] w-full rounded-md border" />
    </div>
  );
}
```

- [ ] **Step 4: Add "Tickets" nav entry to nav-items.tsx**

In `components/dashboard/nav-items.tsx`:

**Add `Ticket` to the lucide imports** (line ~10):
```tsx
import {
  Building2,
  ChevronDown,
  Contact,
  Database,
  Factory,
  FileText,
  MapPin,
  Route,
  Settings,
  Ticket,
  Users,
  Wrench,
} from "lucide-react";
```

**Add `isTickets` state** after the existing `isMasterData` line (~line 44):
```tsx
const isTickets = pathname.startsWith("/tickets");
```

**Insert the Tickets button** between the Wartung button and the Stammdaten dropdown. Find the comment `{/* Stammdaten - dropdown */}` and insert the block immediately before it:

```tsx
      {/* Tickets - simple link */}
      <Button
        variant={isTickets ? "secondary" : "ghost"}
        size="sm"
        asChild
        className="gap-2 cursor-pointer"
      >
        <Link href="/tickets">
          <Ticket className="h-4 w-4" />
          <span className="hidden md:inline">Tickets</span>
        </Link>
      </Button>

      {/* Stammdaten - dropdown */}
```

The `{/* Stammdaten - dropdown */}` comment is shown here only as a location anchor — do not duplicate it, just insert the Tickets button block before it.

- [ ] **Step 5: Full build verification**

```bash
cd D:/git/awadi-web && pnpm build
```

Expected: build completes successfully. All pages compile. No TypeScript errors.

- [ ] **Step 6: Visual verification**

```bash
cd D:/git/awadi-web && pnpm dev
```

Open `http://localhost:3000`. Verify:
- "Tickets" button appears in the nav between "Wartung" and "Stammdaten"
- Clicking "Tickets" navigates to `/tickets`
- The tickets table renders with correct columns: Ticket-Nr., Titel, Status, Priorität, Kontakt, E-Mail, Anlage, Erstellt am, (delete button)
- Status and Priorität show colored badge pills
- Empty state shows "Keine Tickets gefunden."
- "Neues Ticket" button is visible (navigates to /tickets/new which returns 404 — expected for phase 1)
- Status and Priorität filter dropdowns work
- Search box + Suchen button are present

- [ ] **Step 7: Commit**

```bash
git add components/dashboard/ticket-table-server.tsx \
        app/(dashboard)/tickets/page.tsx \
        app/(dashboard)/tickets/loading.tsx \
        components/dashboard/nav-items.tsx
git commit -m "feat(tickets): add page, server wrapper, loading skeleton, and nav entry"
```
