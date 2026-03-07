# Anlage Wartungsvertrag Picker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Wartungsvertrag (maintenance contract) display to the facility edit and create forms, and rearrange the Stammdaten card so Anlagen-Nr. is alone in row 1 and Eigentümer + Wartungsvertrag are side-by-side in row 2.

**Architecture:** Extend the existing `VertragPicker` component to accept an `anlageId` filter (in addition to the existing `kundenId`). Add `anlageId` support to the data layer. In the edit form, render `<VertragPicker anlageId={anlage.id} />`; in the create form, render a static disabled placeholder since no anlage_id exists yet.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Supabase client (`lib/supabase/server.ts`), shadcn/ui

---

### Task 1: Extend VertragQueryParams with anlageId

**Files:**
- Modify: `lib/types/vertrag.ts`

**Step 1: Add `anlageId` to the query params interface**

In `lib/types/vertrag.ts`, add `anlageId?: number` to `VertragQueryParams`:

```ts
export interface VertragQueryParams {
  search?: string;
  filterAktiv?: VertragFilterAktiv;
  kundenId?: number;
  anlageId?: number;          // ← add this line
  sortField?: VertragSortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}
```

**Step 2: Commit**

```bash
git add lib/types/vertrag.ts
git commit -m "feat: add anlageId filter param to VertragQueryParams"
```

---

### Task 2: Apply anlageId filter in getVertraege

**Files:**
- Modify: `lib/data/vertraege.ts`

**Step 1: Destructure anlageId from params and apply filter**

In `getVertraege`, add `anlageId` to the destructured params (after `kundenId`) and add the filter after the existing `kundenId` filter:

```ts
// in the destructuring block:
const {
  search = "",
  filterAktiv = "all",
  kundenId,
  anlageId,          // ← add this
  sortField = "gueltig_ab",
  sortDirection = "desc",
  page = 1,
  pageSize = 14,
} = params;

// after the existing kundenId filter block:
if (anlageId != null) {
  query = query.eq("anlage_id", anlageId);
}
```

**Step 2: Commit**

```bash
git add lib/data/vertraege.ts
git commit -m "feat: support anlageId filter in getVertraege"
```

---

### Task 3: Extend VertragPicker to accept anlageId

**Files:**
- Modify: `components/dashboard/vertrag-picker.tsx`

**Step 1: Update props interface**

Change `VertragPickerProps` so `kundenId` is optional and `anlageId` is added:

```ts
interface VertragPickerProps {
  kundenId?: number;
  anlageId?: number;
}
```

**Step 2: Pass anlageId to fetchVertraege**

In the `useEffect`, pass whichever filter is provided:

```ts
fetchVertraege({
  kundenId,
  anlageId,
  pageSize: 50,
  sortField: "gueltig_ab",
  sortDirection: "desc",
}).then(...)
```

Also update the `useEffect` dependency array to include `anlageId`:

```ts
}, [kundenId, anlageId]);
```

**Step 3: Commit**

```bash
git add components/dashboard/vertrag-picker.tsx
git commit -m "feat: extend VertragPicker to support anlageId filter"
```

---

### Task 4: Rearrange Stammdaten card in anlage-edit-form + add VertragPicker

**Files:**
- Modify: `components/dashboard/anlage-edit-form.tsx`

**Step 1: Add VertragPicker import at the top**

```tsx
import { VertragPicker } from "@/components/dashboard/vertrag-picker";
```

**Step 2: Replace the 2-col "Anlagen-Nr. + Eigentümer" grid with the new 2-row layout**

Find the block starting at line ~191 (the `{/* Anlagen-Nr. + Eigentümer */}` comment) and replace it:

```tsx
{/* Anlagen-Nr. */}
<div className="space-y-1.5">
  <Label htmlFor="anlagen_nr">Anlagen-Nr.</Label>
  <Input
    id="anlagen_nr"
    value={form.anlagen_nr}
    onChange={(e) => set("anlagen_nr", e.target.value)}
    placeholder="z. B. AS-290"
  />
</div>

{/* Eigentümer + Wartungsvertrag */}
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-1.5">
    <Label>Eigentümer <span className="text-destructive">*</span></Label>
    <KundePicker
      value={form.kunden_id ?? null}
      onChange={(id) => set("kunden_id", id ?? 0)}
      initial={{
        id: anlage.kunden_id,
        name: anlage.owner_name ?? `Kunde #${anlage.kunden_id}`,
        address: [
          [anlage.owner_strasse, anlage.owner_hausnr]
            .filter(Boolean)
            .join(" "),
          [anlage.owner_plz, anlage.owner_ort]
            .filter(Boolean)
            .join(" "),
        ]
          .filter(Boolean)
          .join(", "),
      }}
    />
  </div>
  <div className="space-y-1.5">
    <Label>Wartungsvertrag</Label>
    <VertragPicker anlageId={anlage.id} />
  </div>
</div>
```

**Step 3: Commit**

```bash
git add components/dashboard/anlage-edit-form.tsx
git commit -m "feat: add Wartungsvertrag picker to facility edit form"
```

---

### Task 5: Rearrange Stammdaten card in anlage-create-form + add disabled placeholder

**Files:**
- Modify: `components/dashboard/anlage-create-form.tsx`

**Step 1: Replace the 2-col "Anlagen-Nr. + Eigentümer" grid with the new 2-row layout**

Find the block starting at line ~142 (the `{/* Anlagen-Nr. + Eigentümer */}` comment) and replace it:

```tsx
{/* Anlagen-Nr. */}
<div className="space-y-1.5">
  <Label htmlFor="anlagen_nr">
    Anlagen-Nr. <span className="text-destructive">*</span>
  </Label>
  <Input
    id="anlagen_nr"
    value={form.anlagen_nr}
    onChange={(e) => set("anlagen_nr", e.target.value)}
    placeholder="z. B. AS-290"
  />
</div>

{/* Eigentümer + Wartungsvertrag */}
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-1.5">
    <Label>Eigentümer <span className="text-destructive">*</span></Label>
    <KundePicker
      value={form.kunden_id || null}
      onChange={(id) => set("kunden_id", id ?? 0)}
    />
  </div>
  <div className="space-y-1.5">
    <Label>Wartungsvertrag</Label>
    <div className="rounded-md border bg-muted/30 px-3 py-2.5">
      <p className="text-sm text-muted-foreground">
        Erst nach dem Speichern verfügbar
      </p>
    </div>
  </div>
</div>
```

**Step 2: Commit**

```bash
git add components/dashboard/anlage-create-form.tsx
git commit -m "feat: add Wartungsvertrag placeholder to facility create form"
```

---

### Task 6: Verify in browser

**Steps:**
1. Run `pnpm dev`
2. Navigate to an existing facility edit page — the Stammdaten card should show:
   - Anlagen-Nr. alone on row 1
   - Eigentümer picker | Wartungsvertrag picker on row 2
   - Wartungsvertrag picker loads the contract(s) for this specific facility
3. Navigate to the facility create page — same layout but row 2 right column shows "Erst nach dem Speichern verfügbar"
4. Confirm the customer edit form still works (VertragPicker with kundenId still functions)
