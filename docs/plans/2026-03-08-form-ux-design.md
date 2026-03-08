# Form UX (Toast + Dirty Check) — Design Document

**Date:** 2026-03-08
**Branch:** feature/form-ux
**Status:** Approved

## Overview

Improve the customer create and edit form UX with two features:
1. **Toast notifications** — replace inline error/success text with sonner toasts
2. **Dirty check** — warn users with a dialog when they try to leave with unsaved changes

## Scope

Customer forms only (create + edit). The same pattern will be applied to other entity forms in future iterations.

## Toast Notifications

**Library:** `sonner` (shadcn/ui's recommended toast library). Install via `pnpm add sonner`. Add `<Toaster />` once to `app/(dashboard)/layout.tsx`.

**Triggers:**

| Event | Toast |
|-------|-------|
| Validation fails (missing nachname/firma) | `toast.error("Bitte Nachname oder Firma angeben.")` |
| Server action returns error | `toast.error(errorMessage)` |
| Save succeeds (edit form) | `toast.success("Gespeichert")` |
| Save succeeds (create form) | `toast.success("Kunde angelegt")` then navigate |

The current inline red error text and green checkmark success indicator are removed — toasts replace them entirely.

## Dirty Check

**Tracking:** On mount, snapshot the initial form values. Compare current values on every change via `JSON.stringify` — produces `isDirty` boolean.

**Triggers:**
- **Cancel button click** while `isDirty` → show `UnsavedChangesDialog`
- **Browser tab close/refresh** while `isDirty` → `beforeunload` listener (browser native prompt)
- Nav links / browser back: not intercepted (Next.js 15 App Router limitation)

**Reset dirty state:** After a successful save, update the initial snapshot so `isDirty` becomes false.

## UnsavedChangesDialog

Reusable component using the existing shadcn `AlertDialog`. Props: `open`, `onStay`, `onSaveAndLeave`, `onLeave`.

```
Ungespeicherte Änderungen

Sie haben ungespeicherte Änderungen.
Möchten Sie die Seite wirklich verlassen?

[ Auf der Seite bleiben ]   [ Speichern und verlassen ]   [ Verlassen ]
```

**Button behavior:**
- **Auf der Seite bleiben** — closes dialog, user stays on form
- **Speichern und verlassen** — runs validation + server action; on success navigates to list (`/master-data/customers`); on error shows `toast.error(...)`, closes dialog, user stays on form to fix
- **Verlassen** — navigates to list without saving

## Files

### New
- `components/dashboard/unsaved-changes-dialog.tsx` — reusable dialog component

### Modified
- `app/(dashboard)/layout.tsx` — add `<Toaster />` from sonner
- `components/dashboard/customer-create-form.tsx` — toasts + dirty check
- `components/dashboard/customer-edit-form.tsx` — toasts + dirty check

## Dirty Check Implementation Pattern

```typescript
// Snapshot on mount
const [initialValues, setInitialValues] = useState(() => getFormSnapshot());
const isDirty = JSON.stringify(formValues) !== JSON.stringify(initialValues);

// Reset after successful save
setInitialValues(getFormSnapshot());

// Browser tab close warning
useEffect(() => {
  if (!isDirty) return;
  const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, [isDirty]);
```

## "Speichern und verlassen" Flow

1. Run same validation as normal submit
2. Call server action
3. On success → `router.push("/master-data/customers")`
4. On error → `toast.error(errorMessage)`, close dialog, user stays on form
