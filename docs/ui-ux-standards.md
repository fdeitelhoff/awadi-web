# AWADI UI/UX Standards

> Forward-looking reference for all UI development in this project.
> Every form, table, dialog, and interactive component must follow these standards.
> This document is authoritative for both human developers and the Claude Code agent.

---

## 1. Design Principles

These seven rules are the foundation behind every pattern below. When a new situation arises that is not covered by a specific pattern, apply the principle that fits best.

1. **Feedback is never silent.** Every user action that modifies data — save, create, delete — produces explicit visible feedback. No silent success, no silent failure.

2. **Field errors live at the field.** Validation errors for a specific field appear as an inline message directly below that field and a red border on the input. Toasts are reserved for server/action-layer errors and success confirmations — never for field-level validation.

3. **Required fields are marked before the user tries to submit.** An asterisk (`*`) next to the label signals a required field. The first submit attempt reveals inline errors on all failing fields simultaneously; the user is never left guessing which field is wrong.

4. **Loading states are always explicit.** Any async operation on a button shows a spinner on that button while in flight. Any table or list that is re-fetching shows skeleton rows. The UI never appears frozen.

5. **Destructive actions require confirmation.** Deletes and irreversible operations are always confirmed via `AlertDialog` before execution. A single click never destroys data.

6. **Unsaved form changes are protected.** All edit and create forms track dirty state and block navigation with `UnsavedChangesDialog` until the user explicitly chooses to save, discard, or stay. A `beforeunload` handler provides a second layer of protection.

7. **Patterns are consistent across all entities.** The same interaction type — a validation error, a save success, a delete confirmation — always looks and behaves identically regardless of which entity (Kunde, Anlage, Kontakt, …) is being edited. Never invent a one-off pattern for a specific form.

---

## 2. Interaction Patterns

### 2.1 Required field marking

Any field validated as required gets an asterisk in its `Label`, rendered in `text-destructive`:

```tsx
<Label htmlFor="nachname">
  Nachname <span className="text-destructive" aria-hidden="true">*</span>
</Label>
```

- `aria-hidden="true"` prevents screen readers from announcing "asterisk"; `aria-required="true"` on the input carries the semantic meaning.
- Never use placeholder text to indicate required status.
- The asterisk is visible at all times — not only after a failed submit attempt.

---

### 2.2 Form validation & field error state

**Timing:** Validation runs on submit only. Error states clear **per-field** the moment the user makes any change to that field (`onChange`) — regardless of whether the new value is valid. Re-running field-level validation on `onChange` is not required.

**On a failing field:**
- The input receives `aria-required={true}` (always on required fields) and `aria-invalid={true}` (only when the field currently has an error)
- `className` conditionally adds `border-destructive`
- A `<p className="text-sm text-destructive mt-1">` error message appears directly below the input
- No toast fires for this error

**Mutual-exclusion rules** (e.g. "Nachname **or** Firma required"): both fields are highlighted and show the same inline message: `"Nachname oder Firma ist erforderlich."`

**Multiple errors:** all failing fields are highlighted simultaneously on submit. The form does not scroll to the first error — the inline highlighting on each field is the sole signal.

**Submit with no changes (`isDirty === false`):** the save proceeds normally, the server call is made, and the success toast fires. There is no "nothing changed" guard — it is always safe to re-save.

**Server/action errors:** returned from a Server Action are shown via `toast.error()` — never via inline field errors — since the server does not know which specific field caused the failure.

---

### 2.3 Toast feedback (Sonner)

```tsx
import { toast } from "sonner";
```

| Trigger | Call | Wording |
|---|---|---|
| Record saved (edit) | `toast.success(...)` | `"Gespeichert"` |
| Record created | `toast.success(...)` | `"[Entity] angelegt"` — e.g. `"Kunde angelegt"` |
| Record deleted | `toast.success(...)` | `"[Entity] gelöscht"` — e.g. `"Kunde gelöscht"` |
| Server / action failure | `toast.error(...)` | The server's error message, or `"Unbekannter Fehler."` |

**Rules:**
- Never pass a `duration` prop — use the Sonner global default without exception.
- Never pass a `description` prop.
- Never call `toast` inside a validation path — that path uses inline field errors.
- `toast.error` is the exclusive mechanism for action-layer failures. `AlertDialog` is used only for pre-action confirmation, never to report errors. This applies to table-level errors (e.g. delete failure) too.

---

### 2.4 Loading states

| Context | Pattern |
|---|---|
| Button during async op | `disabled` + `<Loader2 className="mr-2 h-4 w-4 animate-spin" />` prepended to label text |
| Table re-fetching | Full set of `PAGE_SIZE` skeleton rows at the component's fixed `ROW_HEIGHT` |
| Deleting a single table row | Only that row's delete button is `disabled` with spinner; all other rows remain interactive |
| Page-level data load | Next.js `loading.tsx` with a skeleton that mirrors the page layout — see `app/(dashboard)/master-data/loading.tsx` as the canonical example. Note: this covers page-section skeletons, not table-row skeletons — see §3.8 for those. |

The `Loader2` import comes from `lucide-react`. The button must be `disabled` while the spinner is visible to prevent double-submission.

**Per-row delete button pattern** (controlled by `deletingId: number | null`):

```tsx
const [deletingId, setDeletingId] = useState<number | null>(null);

<Button
  variant="destructive"
  size="sm"
  disabled={deletingId === item.id}
  onClick={(e) => handleDeleteClick(e, item.id)}
>
  {deletingId === item.id && (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  )}
  Löschen
</Button>
```

Only the row currently being deleted shows a spinner; all other rows' delete buttons remain fully interactive.

---

### 2.5 Destructive actions

All deletes and irreversible operations are gated by `AlertDialog` before execution:

- **Title:** `"[Entity] löschen?"`
- **Body:** `"Dieser Vorgang kann nicht rückgängig gemacht werden. [Entity] wird dauerhaft aus der Datenbank entfernt."`
- **Footer buttons:** "Abbrechen" (cancel, closes dialog) · "Löschen" (`bg-destructive text-destructive-foreground`)

After successful execution: `toast.success("[Entity] gelöscht")`.
After failed execution: `toast.error(message)`. Never a second `AlertDialog` for errors.

The dialog is controlled by a `pendingDeleteId` state (`number | null`): non-null means open, `null` means closed/cancelled.

---

### 2.6 Empty & zero-result states

Tables maintain a fixed height equal to `PAGE_SIZE` rows at all times (prevents layout shift).

When the data set is empty:
1. First row: full `colSpan`, `text-center text-muted-foreground`, text: `"Keine [Entities] gefunden."`
2. Remaining `PAGE_SIZE - 1` rows: transparent filler — `className="border-b-0 hover:bg-transparent"`, `<TableCell colSpan={COLSPAN} className="p-0" />`

No "clear filters" CTA is embedded in the empty state — the toolbar controls handle that.

---

### 2.7 Unsaved changes guard

Every create and edit form must implement the full dirty-state guard:

1. **Dirty detection:** `const isDirty = JSON.stringify(form) !== JSON.stringify(initialValues)`
   - This relies on `form` and `initialValues` being built from the same `makeSnapshot` function so that key order is always identical. Do not use `JSON.stringify` dirty detection on objects with inconsistent key ordering.
2. **Browser close protection:** attach a `beforeunload` handler via `useEffect` when `isDirty` is true:
   ```ts
   const handler = (e: BeforeUnloadEvent) => {
     e.preventDefault();
     e.returnValue = ""; // required for Chrome to show the native dialog
   };
   ```
3. **Back-button interception:** `handleBackClick` checks `isDirty`; if true, opens `UnsavedChangesDialog` instead of navigating.
4. **Dialog options:** "Auf der Seite bleiben" · "Speichern und verlassen" · "Verlassen" (destructive).

`initialValues` is updated to match `form` **in both save paths**: after a direct successful save (in `handleSubmit`) and after "Speichern und verlassen" succeeds (inside `handleSaveAndLeave`). Missing either update leaves the form falsely dirty.

> **Note:** `UnsavedChangesDialog` is its own reusable component, not an `AlertDialog` for a destructive action. It uses raw `Button` components rather than `AlertDialogAction`/`AlertDialogCancel` because it has three choices, not the standard two. This is the intended pattern.

---

## 3. Component Notes

### 3.1 Input — error variant

The shadcn `Input` component accepts `className`. Apply `border-destructive` conditionally:

```tsx
<Input
  id="nachname"
  value={form.nachname}
  aria-required={true}
  aria-invalid={!!errors.nachname}
  onChange={(e) => {
    set("nachname", e.target.value);
    if (errors.nachname) clearError("nachname");
  }}
  className={errors.nachname ? "border-destructive" : ""}
/>
```

`aria-invalid` is always a boolean derived from the errors map — never hardcoded.

---

### 3.2 Label — required marker

```tsx
<Label htmlFor="field">
  Feldname <span className="text-destructive" aria-hidden="true">*</span>
</Label>
```

Place the `*` inside the label text, after the field name, separated by a space. Do not wrap it in parentheses or use "Pflichtfeld" text.

---

### 3.3 Error state management pattern in forms

Every form with required fields uses an errors map:

```tsx
const [errors, setErrors] = useState<Partial<Record<keyof FormType, string>>>({});

const clearError = (field: keyof FormType) =>
  setErrors((prev) => {
    const next = { ...prev };
    delete next[field];
    return next;
  });

const validate = (): boolean => {
  const next: Partial<Record<keyof FormType, string>> = {};

  if (!form.nachname?.trim() && !form.firma?.trim()) {
    next.nachname = "Nachname oder Firma ist erforderlich.";
    next.firma = "Nachname oder Firma ist erforderlich.";
  }
  // … additional rules …

  setErrors(next);
  return Object.keys(next).length === 0;
};

const performSave = async () => {
  if (!validate()) return false;
  // … server call …
};
```

`validate()` is called at the top of every `performSave` / `handleSubmit`. If it returns `false`, execution stops — no server call, no toast.

---

### 3.4 Toast / Sonner

```tsx
import { toast } from "sonner";
```

Four valid call sites only — see table in §2.3. Do not import `useToast` or any other toast mechanism; Sonner is the single toast library in this project.

---

### 3.5 AlertDialog — destructive confirmation

```tsx
const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

<AlertDialog
  open={pendingDeleteId !== null}
  onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
>
  <AlertDialogContent className="max-w-sm">
    <AlertDialogHeader>
      <AlertDialogTitle>Kunde löschen?</AlertDialogTitle>
      <AlertDialogDescription>
        Dieser Vorgang kann nicht rückgängig gemacht werden.
        Der Kunde wird dauerhaft aus der Datenbank entfernt.
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
```

Use `max-w-sm` on the content. Keep the body text to one or two sentences.

---

### 3.6 Select — error variant

`SelectTrigger` renders as a `<button role="combobox">` — `aria-invalid` is not valid on this role. Instead, associate the error message via `aria-describedby`:

```tsx
<Select value={form.field} onValueChange={(v) => { set("field", v); clearError("field"); }}>
  <SelectTrigger
    id="field"
    aria-describedby={errors.field ? "field-error" : undefined}
    className={errors.field ? "border-destructive" : ""}
  >
    <SelectValue placeholder="Auswählen…" />
  </SelectTrigger>
  <SelectContent>…</SelectContent>
</Select>
{errors.field && (
  <p id="field-error" className="text-sm text-destructive mt-1">{errors.field}</p>
)}
```

The `id` on the error paragraph must be unique per field on the page.

---

### 3.7 Textarea — error variant

Same pattern as Input — `border-destructive` + `aria-invalid` + inline error paragraph:

```tsx
<Textarea
  id="kommentar"
  value={form.kommentar}
  aria-required={true}
  aria-invalid={!!errors.kommentar}
  onChange={(e) => {
    set("kommentar", e.target.value);
    if (errors.kommentar) clearError("kommentar");
  }}
  className={errors.kommentar ? "border-destructive" : ""}
/>
{errors.kommentar && (
  <p className="text-sm text-destructive mt-1">{errors.kommentar}</p>
)}
```

---

### 3.8 Skeleton — table loading rows

Always render exactly `PAGE_SIZE` skeleton rows at the component's fixed `ROW_HEIGHT`. Each skeleton cell uses a fixed `w-` value to approximate real content width — avoid `w-full`.

See `components/dashboard/customer-table.tsx` (the loading branch inside `TableBody`) as the canonical reference for skeleton widths per column type:
- Status / badge columns: `w-16`
- ID / short code columns: `w-12`
- Name columns: `w-24` – `w-28`
- Address / long text columns: `w-32`
- Narrow numeric columns: `w-14`

---

### 3.9 Pagination — data tables

Every paginated data table must render four navigation buttons in this order: **first · prev · [page indicator] · next · last**.

```tsx
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

{totalPages > 1 && (
  <div className="flex items-center gap-1 ml-2">
    <Button variant="outline" size="sm" aria-label="Erste Seite"
      onClick={() => setCurrentPage(1)}
      disabled={currentPage === 1 || isLoading}>
      <ChevronsLeft className="h-4 w-4" />
    </Button>
    <Button variant="outline" size="sm" aria-label="Vorherige Seite"
      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
      disabled={currentPage === 1 || isLoading}>
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <span className="text-sm text-muted-foreground tabular-nums px-1">
      Seite <b>{currentPage}</b> von <b>{totalPages}</b>
    </span>
    <Button variant="outline" size="sm" aria-label="Nächste Seite"
      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
      disabled={currentPage === totalPages || isLoading}>
      <ChevronRight className="h-4 w-4" />
    </Button>
    <Button variant="outline" size="sm" aria-label="Letzte Seite"
      onClick={() => setCurrentPage(totalPages)}
      disabled={currentPage === totalPages || isLoading}>
      <ChevronsRight className="h-4 w-4" />
    </Button>
  </div>
)}
```

**Rules:**
- All four buttons are always rendered together — never omit first/last.
- Each button carries an `aria-label` (German) for screen readers since it is icon-only.
- First and prev are `disabled` when `currentPage === 1`; next and last when `currentPage === totalPages`. Both also disable during a loading fetch.
- Page indicator wording: `Seite <b>{currentPage}</b> von <b>{totalPages}</b>` with `tabular-nums` to prevent the label from shifting width.
- The entire pagination block is only rendered when `totalPages > 1`.
- `currentPage` resets to `1` on any filter, sort, or search change.

---

## 4. Scope note

This document covers desktop viewport usage. Responsive / mobile behavior is not currently specified — AWADI is a desktop-first application. Any future mobile work requires a separate addendum to this document before implementation begins.
