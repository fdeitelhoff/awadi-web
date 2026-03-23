# Customer UI Standards Remediation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `customer-table.tsx`, `customer-create-form.tsx`, and `customer-edit-form.tsx` into full compliance with `docs/ui-ux-standards.md`.

**Architecture:** Three independent file edits — table fix first (standalone), then create form, then edit form. No new files required. Changes are additive (new state, new helpers) plus targeted replacements of toast-based validation with inline field errors.

**Tech Stack:** React 19, Next.js App Router, shadcn/ui (new-york), Sonner (toast), Tailwind CSS, TypeScript. No automated test framework — verification is manual via `pnpm dev`.

**Standards reference:** `docs/ui-ux-standards.md`

---

## Audit summary

### `customer-table.tsx` — 2 violations

| # | Violation | Rule |
|---|---|---|
| T1 | Delete failure uses a second `AlertDialog` (`deleteError` state, lines 75, 93, 107, 292–307) | §2.3 known deviation / §2.5 |
| T2 | Delete success produces no feedback | §2.3 |

### `customer-create-form.tsx` — 5 violations

| # | Violation | Rule |
|---|---|---|
| C1 | `validate()` fires `toast.error(...)` instead of inline field errors | §2.2 |
| C2 | Nachname and Firma labels have no required asterisk | §2.1, §3.2 |
| C3 | Nachname and Firma inputs have no `aria-required`, `aria-invalid`, or `border-destructive` | §3.1 |
| C4 | No `errors` state or `clearError` helper | §3.3 |
| C5 | `beforeunload` handler missing `e.returnValue = ""` | §2.7 |

### `customer-edit-form.tsx` — 5 violations

| # | Violation | Rule |
|---|---|---|
| E1 | No client-side `validate()` call — form submits to server with no required-field check | §2.2 |
| E2 | Nachname and Firma labels have no required asterisk | §2.1, §3.2 |
| E3 | Nachname and Firma inputs have no `aria-required`, `aria-invalid`, or `border-destructive` | §3.1 |
| E4 | No `errors` state or `clearError` helper | §3.3 |
| E5 | `beforeunload` handler missing `e.returnValue = ""` | §2.7 |

---

## Task 1 — Fix `customer-table.tsx` (T1, T2)

**Files:**
- Modify: `components/dashboard/customer-table.tsx`

- [ ] **Step 1: Add `toast` import**

Add at line 5 (after `useRouter` import):
```tsx
import { toast } from "sonner";
```

- [ ] **Step 2: Remove `deleteError` state**

Remove line 75:
```tsx
// DELETE this line:
const [deleteError, setDeleteError] = useState<string | null>(null);
```

- [ ] **Step 3: Clean up `handleDeleteClick`**

Remove the `setDeleteError(null)` call (line 93) — it's no longer needed:
```tsx
const handleDeleteClick = (e: React.MouseEvent, id: number) => {
  e.stopPropagation();
  setPendingDeleteId(id);
};
```

- [ ] **Step 4: Update `handleDeleteConfirm` — add success toast, replace error state with toast**

Replace lines 97–110 with:
```tsx
const handleDeleteConfirm = async () => {
  if (pendingDeleteId === null) return;
  const id = pendingDeleteId;
  setPendingDeleteId(null);
  setDeletingId(id);
  const result = await deleteKunde(id);
  if (result.success) {
    setKunden((prev) => prev.filter((k) => k.id !== id));
    setTotalCount((c) => c - 1);
    toast.success("Kunde gelöscht");
  } else {
    toast.error(result.error ?? "Löschen fehlgeschlagen.");
  }
  setDeletingId(null);
};
```

- [ ] **Step 5: Remove the delete-error `AlertDialog` (lines 292–307)**

Remove the entire second `AlertDialog` block:
```tsx
// DELETE this entire block:
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
      <AlertDialogAction onClick={() => setDeleteError(null)}>
        OK
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

- [ ] **Step 6: Verify manually**

```bash
pnpm dev
```
Navigate to `/master-data/customers`. Delete a customer:
- Confirm dialog appears → click "Löschen" → `toast.success("Kunde gelöscht")` appears in top-right, row disappears.
- To test error: temporarily make `deleteKunde` return `{ success: false, error: "Test error" }` → toast.error appears (no AlertDialog).

- [ ] **Step 7: Commit**

```bash
git add components/dashboard/customer-table.tsx
git commit -m "fix: replace delete-error AlertDialog with toast, add delete success toast"
```

---

## Task 2 — Fix `customer-create-form.tsx` (C1–C5)

**Files:**
- Modify: `components/dashboard/customer-create-form.tsx`

- [ ] **Step 1: Add `errors` state and `clearError` helper**

After the existing `const [isDialogOpen, setIsDialogOpen] = useState(false);` line (~line 50), add:
```tsx
const [errors, setErrors] = useState<Partial<Record<keyof CreateKundeInput, string>>>({});

const clearError = (field: keyof CreateKundeInput) =>
  setErrors((prev) => {
    const next = { ...prev };
    delete next[field];
    return next;
  });
```

- [ ] **Step 2: Fix `beforeunload` handler — add `e.returnValue = ""`**

Replace the existing `beforeunload` handler (lines 57–64):
```tsx
useEffect(() => {
  if (!isDirty) return;
  const handler = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = "";
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, [isDirty]);
```

- [ ] **Step 3: Rewrite `validate()` to use inline errors instead of toast**

Replace lines 66–72:
```tsx
const validate = (): boolean => {
  const next: Partial<Record<keyof CreateKundeInput, string>> = {};
  if (!form.nachname?.trim() && !form.firma?.trim()) {
    next.nachname = "Nachname oder Firma ist erforderlich.";
    next.firma = "Nachname oder Firma ist erforderlich.";
  }
  setErrors(next);
  return Object.keys(next).length === 0;
};
```

- [ ] **Step 4: Update the Nachname field — label asterisk, error props, inline error**

Replace the Nachname `<div className="space-y-1.5">` block (inside the Vorname/Nachname grid):
```tsx
<div className="space-y-1.5">
  <Label htmlFor="nachname">
    Nachname <span className="text-destructive" aria-hidden="true">*</span>
  </Label>
  <Input
    id="nachname"
    value={form.nachname}
    aria-required="true"
    aria-invalid={!!errors.nachname}
    onChange={(e) => {
      set("nachname", e.target.value);
      if (errors.nachname) clearError("nachname");
    }}
    className={errors.nachname ? "border-destructive" : ""}
  />
  {errors.nachname && (
    <p className="text-sm text-destructive mt-1">{errors.nachname}</p>
  )}
</div>
```

- [ ] **Step 5: Update the Firma field — label asterisk, error props, inline error**

Replace the Firma `<div className="space-y-1.5">` block:
```tsx
<div className="space-y-1.5">
  <Label htmlFor="firma">
    Firma <span className="text-destructive" aria-hidden="true">*</span>
  </Label>
  <Input
    id="firma"
    value={form.firma}
    aria-invalid={!!errors.firma}
    onChange={(e) => {
      set("firma", e.target.value);
      if (errors.firma) clearError("firma");
    }}
    className={errors.firma ? "border-destructive" : ""}
  />
  {errors.firma && (
    <p className="text-sm text-destructive mt-1">{errors.firma}</p>
  )}
</div>
```

Note: Firma does **not** get `aria-required` because it is not independently required — the rule is "Nachname **or** Firma". Only Nachname carries `aria-required`.

- [ ] **Step 6: Remove the unused `toast` import from validate path**

`toast` is still used in `performSave` (server error) and `handleSubmit`/`handleSaveAndLeave` (success) — keep the import. No change needed here.

- [ ] **Step 7: Verify manually**

```bash
pnpm dev
```
Navigate to `/master-data/customers/new`:
1. Click "Speichern" with empty Nachname and Firma → both inputs get red border, inline error "Nachname oder Firma ist erforderlich." appears under each. No toast.
2. Type anything in Nachname → red border and error text on Nachname clear immediately.
3. Fill in a valid Nachname, click "Speichern" → saves normally, `toast.success("Kunde angelegt")` fires, redirects to edit page.
4. Close the browser tab with unsaved changes → browser native "leave?" dialog appears.

- [ ] **Step 8: Commit**

```bash
git add components/dashboard/customer-create-form.tsx
git commit -m "fix: replace toast validation with inline field errors in customer create form"
```

---

## Task 3 — Fix `customer-edit-form.tsx` (E1–E5)

**Files:**
- Modify: `components/dashboard/customer-edit-form.tsx`

- [ ] **Step 1: Add `errors` state and `clearError` helper**

After `const [isDialogOpen, setIsDialogOpen] = useState(false);` (~line 72), add:
```tsx
const [errors, setErrors] = useState<Partial<Record<keyof UpdateKundeInput, string>>>({});

const clearError = (field: keyof UpdateKundeInput) =>
  setErrors((prev) => {
    const next = { ...prev };
    delete next[field];
    return next;
  });
```

- [ ] **Step 2: Fix `beforeunload` handler — add `e.returnValue = ""`**

Replace the existing handler (lines 79–86):
```tsx
useEffect(() => {
  if (!isDirty) return;
  const handler = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = "";
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, [isDirty]);
```

- [ ] **Step 3: Add `validate()` function**

Add after the `clearError` helper:
```tsx
const validate = (): boolean => {
  const next: Partial<Record<keyof UpdateKundeInput, string>> = {};
  if (!form.nachname?.trim() && !form.firma?.trim()) {
    next.nachname = "Nachname oder Firma ist erforderlich.";
    next.firma = "Nachname oder Firma ist erforderlich.";
  }
  setErrors(next);
  return Object.keys(next).length === 0;
};
```

- [ ] **Step 4: Call `validate()` at the top of `performSave`**

Replace lines 88–99:
```tsx
const performSave = async (): Promise<boolean> => {
  if (isSaving) return false;
  if (!validate()) return false;
  setIsSaving(true);
  const result = await updateKunde(kunde.id, form);
  setIsSaving(false);
  if (!result.success) {
    toast.error(result.error ?? "Unbekannter Fehler.");
    return false;
  }
  setInitialValues({ ...form });
  return true;
};
```

- [ ] **Step 5: Update the Nachname field — label asterisk, error props, inline error**

Replace the Nachname `<div className="space-y-1.5">` block (inside the Vorname/Nachname grid):
```tsx
<div className="space-y-1.5">
  <Label htmlFor="nachname">
    Nachname <span className="text-destructive" aria-hidden="true">*</span>
  </Label>
  <Input
    id="nachname"
    value={form.nachname}
    aria-required="true"
    aria-invalid={!!errors.nachname}
    onChange={(e) => {
      set("nachname", e.target.value);
      if (errors.nachname) clearError("nachname");
    }}
    className={errors.nachname ? "border-destructive" : ""}
  />
  {errors.nachname && (
    <p className="text-sm text-destructive mt-1">{errors.nachname}</p>
  )}
</div>
```

- [ ] **Step 6: Update the Firma field — label asterisk, error props, inline error**

Replace the Firma `<div className="space-y-1.5">` block:
```tsx
<div className="space-y-1.5">
  <Label htmlFor="firma">
    Firma <span className="text-destructive" aria-hidden="true">*</span>
  </Label>
  <Input
    id="firma"
    value={form.firma}
    aria-invalid={!!errors.firma}
    onChange={(e) => {
      set("firma", e.target.value);
      if (errors.firma) clearError("firma");
    }}
    className={errors.firma ? "border-destructive" : ""}
  />
  {errors.firma && (
    <p className="text-sm text-destructive mt-1">{errors.firma}</p>
  )}
</div>
```

- [ ] **Step 7: Verify manually**

```bash
pnpm dev
```
Open an existing customer edit page (e.g. `/master-data/customers/1`):
1. Clear both Nachname and Firma, click "Speichern" → both inputs get red border + inline error. No toast. No server call made.
2. Type anything in either field → that field's error clears immediately.
3. Fill a valid Nachname, click "Speichern" → saves, `toast.success("Gespeichert")` fires.
4. Edit a field and click browser back → `UnsavedChangesDialog` appears.
5. Close tab with unsaved changes → browser native "leave?" dialog appears.

- [ ] **Step 8: Commit**

```bash
git add components/dashboard/customer-edit-form.tsx
git commit -m "fix: add validate() and inline field errors to customer edit form"
```
