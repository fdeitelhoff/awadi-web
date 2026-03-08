# Global Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the placeholder `SearchInput` in the nav with a fully functional global search that queries 6 entity tables and shows results in a dropdown.

**Architecture:** A server action (`lib/actions/search.ts`) runs 6 parallel Supabase queries using `ILIKE` matching and merges results into a typed array. A client component (`global-search.tsx`) manages input state, calls the action on Enter, and renders a grouped dropdown. No DB migrations needed.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Supabase JS client (`@supabase/ssr`), shadcn/ui, Lucide icons, Tailwind CSS.

---

### Task 1: Create the search server action

**Files:**
- Create: `lib/actions/search.ts`

**Step 1: Create the file with types and skeleton**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchResultType =
  | "kunde"
  | "anlage"
  | "kontakt"
  | "wartungsvertrag"
  | "anlagentyp"
  | "benutzer";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  label: string;
  sublabel?: string;
  href: string;
}

const LIMIT = 3;

export async function searchAll(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  return [];
}
```

**Step 2: Implement the 6 parallel Supabase queries**

Replace the `return []` with the full implementation:

```typescript
export async function searchAll(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const supabase = await createClient();
  const q = query.trim();

  const [kunden, anlagen, kontakte, vertraege, typen, benutzer] =
    await Promise.all([
      supabase
        .from("kunden")
        .select("id, nachname, vorname, firma, kundennr")
        .or(
          `nachname.ilike.%${q}%,vorname.ilike.%${q}%,firma.ilike.%${q}%,kundennr.ilike.%${q}%,email.ilike.%${q}%,ort.ilike.%${q}%`,
        )
        .limit(LIMIT),

      supabase
        .from("anlagen")
        .select("id, anlagen_nr, ort")
        .or(
          `anlagen_nr.ilike.%${q}%,ort.ilike.%${q}%,strasse.ilike.%${q}%,plz.ilike.%${q}%`,
        )
        .limit(LIMIT),

      supabase
        .from("kontakte")
        .select("id, nachname, vorname, firma, email")
        .or(
          `nachname.ilike.%${q}%,vorname.ilike.%${q}%,firma.ilike.%${q}%,email.ilike.%${q}%,ort.ilike.%${q}%`,
        )
        .limit(LIMIT),

      supabase
        .from("wartungsvertraege")
        .select("id, vertragsnummer, gueltig_ab, gueltig_bis")
        .or(`vertragsnummer.ilike.%${q}%,comment.ilike.%${q}%`)
        .limit(LIMIT),

      supabase
        .from("anl_typen")
        .select("id, bezeichnung, wartungsintervall_monate, preis_je_wartung")
        .or(`bezeichnung.ilike.%${q}%,comment.ilike.%${q}%`)
        .limit(LIMIT),

      supabase
        .from("profiles")
        .select("id, vorname, nachname, email")
        .or(`vorname.ilike.%${q}%,nachname.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(LIMIT),
    ]);

  const results: SearchResult[] = [];

  for (const k of kunden.data ?? []) {
    results.push({
      id: String(k.id),
      type: "kunde",
      label:
        k.firma ||
        [k.vorname, k.nachname].filter(Boolean).join(" ") ||
        "–",
      sublabel: k.kundennr ?? undefined,
      href: `/master-data/customers/${k.id}`,
    });
  }

  for (const a of anlagen.data ?? []) {
    results.push({
      id: String(a.id),
      type: "anlage",
      label: a.anlagen_nr || String(a.id),
      sublabel: a.ort ?? undefined,
      href: `/master-data/facilities/${a.id}`,
    });
  }

  for (const k of kontakte.data ?? []) {
    results.push({
      id: String(k.id),
      type: "kontakt",
      label:
        k.firma ||
        [k.vorname, k.nachname].filter(Boolean).join(" ") ||
        "–",
      sublabel: k.email ?? undefined,
      href: `/master-data/contacts/${k.id}`,
    });
  }

  for (const v of vertraege.data ?? []) {
    const parts = [v.gueltig_ab, v.gueltig_bis].filter(Boolean);
    results.push({
      id: String(v.id),
      type: "wartungsvertrag",
      label: v.vertragsnummer || String(v.id),
      sublabel: parts.length ? parts.join(" – ") : undefined,
      href: `/master-data/maintenance/${v.id}`,
    });
  }

  for (const t of typen.data ?? []) {
    const parts: string[] = [];
    if (t.wartungsintervall_monate)
      parts.push(`${t.wartungsintervall_monate} Monate`);
    if (t.preis_je_wartung)
      parts.push(
        `${Number(t.preis_je_wartung).toFixed(2).replace(".", ",")} €`,
      );
    results.push({
      id: String(t.id),
      type: "anlagentyp",
      label: t.bezeichnung,
      sublabel: parts.length ? parts.join(" · ") : undefined,
      href: `/settings/facility-types/${t.id}`,
    });
  }

  for (const p of benutzer.data ?? []) {
    results.push({
      id: String(p.id),
      type: "benutzer",
      label:
        [p.vorname, p.nachname].filter(Boolean).join(" ") ||
        p.email ||
        "–",
      sublabel: p.email ?? undefined,
      href: `/settings/users/${p.id}`,
    });
  }

  return results;
}
```

**Step 3: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | head -40
```

Expected: no type errors in `lib/actions/search.ts`. (Other pre-existing errors are fine.)

**Step 4: Commit**

```bash
git add lib/actions/search.ts
git commit -m "feat: add searchAll server action for global search"
```

---

### Task 2: Create the GlobalSearch client component

**Files:**
- Create: `components/dashboard/global-search.tsx`

**Step 1: Create the component skeleton**

```tsx
"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Users,
  Factory,
  Contact,
  FileText,
  Building2,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  searchAll,
  type SearchResult,
  type SearchResultType,
} from "@/lib/actions/search";

const TYPE_CONFIG: Record<
  SearchResultType,
  { label: string; icon: React.ElementType }
> = {
  kunde: { label: "Kunden", icon: Users },
  anlage: { label: "Anlagen", icon: Factory },
  kontakt: { label: "Kontakte", icon: Contact },
  wartungsvertrag: { label: "Wartungsverträge", icon: FileText },
  anlagentyp: { label: "Anlagentypen", icon: Building2 },
  benutzer: { label: "Benutzer", icon: User },
};

const TYPE_ORDER: SearchResultType[] = [
  "kunde",
  "anlage",
  "kontakt",
  "wartungsvertrag",
  "anlagentyp",
  "benutzer",
];

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    startTransition(async () => {
      const data = await searchAll(query.trim());
      setResults(data);
      setIsOpen(true);
    });
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") setIsOpen(false);
  }

  function handleSelect(href: string) {
    setIsOpen(false);
    router.push(href);
  }

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    config: TYPE_CONFIG[type],
    items: results.filter((r) => r.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Suchen… (Enter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-8 h-9 w-full bg-muted/50"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Suche leeren"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-md border bg-popover text-popover-foreground shadow-lg overflow-hidden">
          {isPending ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <span className="animate-spin inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              Suche läuft…
            </div>
          ) : grouped.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Keine Ergebnisse
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto py-1">
              {grouped.map(({ type, config, items }) => {
                const Icon = config.icon;
                return (
                  <div key={type}>
                    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide select-none">
                      {config.label}
                    </div>
                    {items.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => handleSelect(result.href)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 truncate font-medium">
                          {result.label}
                        </span>
                        {result.sublabel && (
                          <span className="text-muted-foreground text-xs truncate max-w-[45%]">
                            {result.sublabel}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | head -40
```

Expected: no type errors in the new file.

**Step 3: Commit**

```bash
git add components/dashboard/global-search.tsx
git commit -m "feat: add GlobalSearch component with grouped dropdown"
```

---

### Task 3: Wire GlobalSearch into the nav and remove old component

**Files:**
- Modify: `components/dashboard/dashboard-nav.tsx`

**Step 1: Update the import in `dashboard-nav.tsx`**

Replace:
```tsx
import { SearchInput } from "./search-input";
```
With:
```tsx
import { GlobalSearch } from "./global-search";
```

**Step 2: Replace the component usage**

Replace:
```tsx
<SearchInput />
```
With:
```tsx
<GlobalSearch />
```

**Step 3: Delete the old placeholder file**

```bash
rm components/dashboard/search-input.tsx
```

**Step 4: Verify the build passes**

```bash
pnpm build
```

Expected: clean build with no errors.

**Step 5: Smoke-test in the browser**

```bash
pnpm dev
```

1. Open `http://localhost:3000`
2. Click the search input in the nav
3. Type a known customer name (e.g. a last name from the DB) and press Enter
4. Confirm the dropdown appears with grouped results and correct labels/sublabels
5. Click a result and confirm navigation to the correct edit page
6. Press X — confirm the input clears and dropdown closes
7. Type a query with no matches — confirm "Keine Ergebnisse" appears

**Step 6: Final commit**

```bash
git add components/dashboard/dashboard-nav.tsx
git commit -m "feat: wire GlobalSearch into nav, remove SearchInput placeholder"
```
