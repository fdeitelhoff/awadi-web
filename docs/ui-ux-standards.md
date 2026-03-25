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

**Mutual-exclusion rules** (e.g. "Nachname **or** Firma required"): both fields are highlighted and show the same inline message: `"Nachname oder Firma ist erforderlich."` Both fields carry `aria-required={true}` and the `*` marker — the asterisk conveys that the group is required, not that each field is independently mandatory.

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

### 2.5 Button intent colors

Button color communicates the intent of an action. Three semantic roles apply:

| Role | Variant | CSS tokens | When to use |
|---|---|---|---|
| **Create / Add** | `success` | `--success` / `--success-foreground` | Any button that creates a new record or opens a create form — e.g. "Neuer Kunde", "+ Anlage hinzufügen" |
| **Save on create form** | `success` | same | The "Speichern" button on a **create** form (completing the creation) |
| **Save on edit form** | `default` | `--primary` / `--primary-foreground` | The "Speichern" button on an **edit** form (updating an existing record) |
| **Destructive / Delete** | `destructive` | `--destructive` / `--destructive-foreground` | Any button that permanently removes data — always paired with an `AlertDialog` (§2.6) |
| **Neutral actions** | `default` / `outline` / `ghost` | — | Search, filter, navigation, cancel, back |

**Rules:**
- A "Neuer [Entity]" button in a toolbar is always `variant="success"`.
- A "Speichern" button is `variant="success"` on create forms and `variant="default"` on edit forms.
- Never use raw Tailwind color classes (`bg-green-500`, `bg-red-600`) on buttons — always use the semantic variants so both light and dark themes are handled automatically.
- The `success` variant uses the `--success` / `--success-foreground` CSS variables already defined in `globals.css` and defined in `buttonVariants` in `components/ui/button.tsx`.

---

### 2.6 Destructive actions

All deletes and irreversible operations are gated by `AlertDialog` before execution:

- **Title:** `"[Entity] löschen?"`
- **Body:** `"Dieser Vorgang kann nicht rückgängig gemacht werden. [Entity] wird dauerhaft aus der Datenbank entfernt."`
- **Footer buttons:** "Abbrechen" (cancel, closes dialog) · "Löschen" (`bg-destructive text-destructive-foreground`)

After successful execution: `toast.success("[Entity] gelöscht")`.
After failed execution: `toast.error(message)`. Never a second `AlertDialog` for errors.

The dialog is controlled by a `pendingDeleteId` state (`number | null`): non-null means open, `null` means closed/cancelled.

---

### 2.7 Empty & zero-result states

Tables maintain a fixed height equal to `PAGE_SIZE` rows at all times (prevents layout shift).

When the data set is empty:
1. First row: full `colSpan`, `text-center text-muted-foreground`, text: `"Keine [Entities] gefunden."`
2. Remaining `PAGE_SIZE - 1` rows: transparent filler — `className="border-b-0 hover:bg-transparent"`, `<TableCell colSpan={COLSPAN} className="p-0" />`

No "clear filters" CTA is embedded in the empty state — the toolbar controls handle that.

---

### 2.8 Unsaved changes guard

Every create and edit form must implement the full dirty-state guard:

1. **Dirty detection:** `const isDirty = JSON.stringify(form) !== JSON.stringify(initialValues)`
   - This relies on `form` and `initialValues` being built from the same `makeSnapshot` function so that key order is always identical. Do not use `JSON.stringify` dirty detection on objects with inconsistent key ordering.
   - **Edit forms must define `makeSnapshot(entity)`** — a function that maps the entity into a plain form object, replacing every `null` with `""` (strings) or `false` (booleans). Both `form` and `initialValues` are initialized via `makeSnapshot`. This guarantees key order is stable across calls. Never inline the field mapping at the `useState` call site — define it once and reuse it for the reset path too (§2.8 point 3).
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

### 2.9 Browser-native validation suppression

All `<form>` elements must carry the `noValidate` attribute. This disables the browser's built-in constraint validation popups (triggered by `type="email"`, `type="url"`, and the `required` attribute), so that every validation signal is handled by our inline-error and toast system instead.

```tsx
<form onSubmit={handleSubmit} className="…" noValidate>
```

**Preserve semantic input types** — keep `type="email"`, `type="url"`, `type="tel"` etc. They provide autofill hints, accessibility semantics, and mobile keyboard optimisation. Only the browser's enforcement is suppressed; our `validate()` function takes over.

**Note on `type="tel"`:** browsers never show a popup for telephone fields regardless of `noValidate`, so no custom validation is needed for format — only require-field checks if applicable.

**Format validation for optional fields** (validate only when the field is non-empty):

| Field type | Regex | Error message |
|---|---|---|
| E-Mail | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | `"Bitte eine gültige E-Mail-Adresse eingeben."` |
| URL / Homepage | `/^https?:\/\/.+\..+/` | `"Bitte eine gültige URL eingeben (z. B. https://example.de)."` |

These format checks follow the same inline-error pattern as required-field checks (§2.2): `aria-invalid`, `border-destructive`, `clearError` on `onChange`, error paragraph below the input. No toast fires for format errors.

---

### 2.10 Search input keyboard shortcuts

All search inputs in data tables must support two keyboard shortcuts:

| Key | Action |
|---|---|
| `Enter` | Triggers the search (same as clicking the "Suchen" button) |
| `Escape` | Clears both the input value and the active search, resets to page 1 |

```tsx
<Input
  placeholder="Suchen…"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") handleClear();
  }}
/>
```

`handleClear` must reset both `searchQuery` (the input value) and `activeSearch` (the committed search term that drives the data fetch), and reset `currentPage` to `1`.

```tsx
const handleClear = () => {
  setSearchQuery("");
  setActiveSearch("");
  setCurrentPage(1);
};
```

---

### 2.11 Double-submission guard

Any `performSave` function that can be triggered from multiple call sites (form submit, "Save and Leave" dialog, etc.) must guard against concurrent invocations:

```tsx
const performSave = async (): Promise<boolean> => {
  if (isSaving) return false;   // ← guard: reject if already in flight
  if (!validate()) return false;
  setIsSaving(true);
  const result = await serverAction(payload);
  setIsSaving(false);
  if (!result.success) {
    toast.error(result.error ?? "Unbekannter Fehler.");
    return false;
  }
  return true;
};
```

**Rules:**
- The guard is the first line — before validation, before any state changes.
- `isSaving` is set to `true` before the async call and reset to `false` unconditionally after, regardless of success or failure.
- All callers (`handleSubmit`, `handleSaveAndLeave`) delegate to `performSave` — they never call the server action directly.

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

### 3.10 Skeleton — form page Suspense fallback

Form pages that load data server-side (edit forms) use a `Suspense` fallback skeleton defined inline in the page file. The skeleton must structurally mirror the form it replaces.

**Header area** — matches the form's page header exactly:

```tsx
<div>
  {/* Ghost sm back button — h-8 matches Button size="sm" */}
  <Skeleton className="h-8 w-16 mb-2" />
  <div className="flex items-center justify-between gap-4">
    <div className="space-y-1.5">
      <Skeleton className="h-8 w-56" />  {/* h1 text-2xl */}
      <Skeleton className="h-4 w-80" />  {/* meta subtitle */}
    </div>
    <Skeleton className="h-9 w-24" />    {/* save button */}
  </div>
</div>
```

**Cards grid** — use the same `grid-cols-2 gap-6` as the form, one `<Skeleton>` per card:

```tsx
<div className="grid grid-cols-2 gap-6">
  <Skeleton className="h-96 rounded-lg" />       {/* Stammdaten  — 4 field rows */}
  <Skeleton className="h-[300px] rounded-lg" />  {/* Adresse     — 3 field rows */}
  <Skeleton className="h-96 rounded-lg" />       {/* Kontakt     — 4 field rows */}
  <Skeleton className="h-56 rounded-lg" />       {/* Anmerkungen — empty state  */}
</div>
```

**Card height formula** (for new cards):
```
CardHeader (~56px) + (rows × 62px) + ((rows − 1) × 16px) + 24px bottom padding
```
Where each field row = Label (20px) + space-y-1.5 (6px) + Input h-9 (36px) = **62px**, and `space-y-4` gaps = **16px** each.

| Row count | Approximate height | Tailwind class |
|---|---|---|
| 3 rows | ~298px | `h-[300px]` |
| 4 rows | ~376px | `h-96` (384px) |
| Empty-state card (icon + text) | ~208px | `h-56` (224px) |

**Rules:**
- Always use `rounded-lg` — matches the shadcn `Card` default radius (`rounded-xl` is wrong).
- The back button skeleton is always `h-8` — it mirrors a `Button` with `size="sm"` (32px).
- Client-only create forms (no async data loading) do not need a Suspense skeleton.
- The `Loading()` default export uses the same flex container as the page (`flex flex-col flex-1 min-h-0 p-6 gap-4`) so the skeleton occupies identical space.

---

### 3.11 Skeleton — list page (`MasterDataSkeleton`)

All master-data list pages use `MasterDataSkeleton` as their `Suspense` fallback. It mirrors the exact layout of a list page: page header + table toolbar + 14 skeleton rows.

```
Fragment:
  ├── shrink-0 div: h1 skeleton + subtitle skeleton
  └── flex flex-col min-h-0 flex-1:
        ├── toolbar div (pb-4): search (w-64) + Suchen btn | filter selects + action btn
        └── rounded-md border overflow-hidden flex-1:
              14 × h-[46px] rows with varied-width skeleton cells
```

**Rules:**
- Row count must equal `PAGE_SIZE` (14) and row height must equal `ROW_HEIGHT` (`h-[46px]`). Update if either constant changes.
- Toolbar skeleton must approximate the actual toolbar: left group (search + primary action) and right group (filter selects + new-record button).
- Do not render skeleton stat cards or other UI elements that do not exist in the actual page.
- `Loading()` uses `<div className="flex flex-col flex-1 min-h-0 p-6 gap-4">` — identical to `CustomersPage` — so the skeleton occupies the same space.

---

### 3.12 Form page header layout

Every entity create/edit page uses this fixed header structure inside the `<form>`:

```tsx
<div>
  <Button
    type="button"
    variant="ghost"
    size="sm"
    className="-ml-2 mb-2"
    onClick={handleBackClick}
  >
    <ArrowLeft className="h-4 w-4 mr-1" />
    Zurück
  </Button>
  <div className="flex items-center justify-between gap-4">
    <h1 className="text-2xl font-semibold">{title}</h1>
    <Button type="submit" disabled={isSaving} className="shrink-0">
      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Speichern
    </Button>
  </div>
</div>
```

**Title wording:**
- Create form: `"Neuer [Entity]"` — e.g. `"Neuer Kunde"`, `"Neue Anlage"`
- Edit form: `"[Entity]: [Name]"` — e.g. `"Kunde: Max Mustermann"`, `"Anlage: Musterstraße 1"`
- If no name is derivable yet, fall back to a generic label: `"[Entity]"`

**Rules:**
- `type="button"` on the back button is mandatory — without it the button submits the form.
- `shrink-0` on the save button prevents text wrapping when the title is long.
- The inline header save button is always present. On long forms (more than ~3 card sections), a second save button is added at the bottom of the form (see §3.13).
- `handleBackClick` checks `isDirty` before navigating — never use `router.push` directly on the back button of a form.

---

### 3.13 Footer save button (long forms)

Forms with more than ~3 card sections duplicate the save button in a footer row so the user can save without scrolling back to the top:

```tsx
<div className="flex justify-end pb-8">
  <Button type="submit" disabled={isSaving}>
    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    Speichern
  </Button>
</div>
```

Both buttons share the same `isSaving` state and are disabled simultaneously. The footer button is `type="submit"` — it does not call `performSave` directly.

---

### 3.14 Edit form meta subtitle

Edit forms display a dot-separated subtitle line under the `h1` with audit and identity information:

```tsx
function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const metaInfo = [
  entity.nummer    && `Nr.: ${entity.nummer}`,
  entity.created_at && `Erstellt: ${formatDateTime(entity.created_at)}`,
  entity.last_update && `Geändert: ${formatDateTime(entity.last_update)}`,
]
  .filter(Boolean)
  .join(" · ");

// Rendered below the h1:
{metaInfo && (
  <p className="text-sm text-muted-foreground mt-0.5">{metaInfo}</p>
)}
```

**Rules:**
- Separator is ` · ` (space + middle dot + space) — never a comma or pipe.
- Only non-null/non-empty fields appear — use `.filter(Boolean)`.
- Timestamps always use `formatDateTime` — never raw ISO strings.
- `formatDateTime` is defined as a module-level helper, not inline.
- Create forms do not show this line (no server-generated timestamps exist yet).

---

### 3.15 Clickable table rows

Rows that navigate to a detail/edit page on click:

```tsx
<TableRow
  className={`${ROW_HEIGHT} cursor-pointer`}
  onClick={() => router.push(`/master-data/entities/${entity.id}`)}
>
  {/* Regular cells — no special treatment */}
  <TableCell>{entity.name}</TableCell>

  {/* Cell with a nested interactive element — must stop propagation */}
  <TableCell>
    {entity.email && (
      <a
        href={`mailto:${entity.email}`}
        onClick={(e) => e.stopPropagation()}
        className="hover:underline"
      >
        {entity.email}
      </a>
    )}
  </TableCell>

  {/* Cell with an action button — must stop propagation */}
  <TableCell className="text-right">
    <Button
      variant="destructive"
      size="sm"
      onClick={(e) => { e.stopPropagation(); handleDeleteClick(e, entity.id); }}
    >
      Löschen
    </Button>
  </TableCell>
</TableRow>
```

**Rules:**
- `cursor-pointer` on the `TableRow` is the sole visual affordance — no underline, no hover highlight beyond the default row hover.
- Every interactive element inside a clickable row (`<a>`, `<Button>`, `<Checkbox>`, etc.) must call `e.stopPropagation()` to prevent the row's navigation from firing.
- The delete button's `onClick` already receives the `e` from the handler — pass it through and call `e.stopPropagation()` there, not inside the handler itself.

---

### 3.16 Card title styling

All cards used as form sections use `text-base` to reduce the title size:

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-base">Section Name</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* fields */}
  </CardContent>
</Card>
```

**Rules:**
- Always apply `className="text-base"` to `CardTitle` inside form cards. The default shadcn size is too large for form section headers.
- `CardContent` uses `space-y-4` for vertical field spacing.
- Never put anything other than `CardTitle` (and optionally `CardDescription`) inside `CardHeader` for form cards.

---

### 3.17 Record count in list page headings

The server component wrapping a list page renders the total record count in the `h1`:

```tsx
// In the server component:
const count = await getEntityCount();

<h1 className="text-2xl font-semibold">
  Entitäten ({count.toLocaleString("de-DE")})
</h1>
```

**Rules:**
- Always format with `toLocaleString("de-DE")` so numbers above 999 display with a `.` thousand separator.
- The count is the **unfiltered total** — it reflects how many records exist, not how many the current filter/search returns.
- The count is fetched server-side in the server wrapper component, not client-side in the table component.
- Wording: the entity name is plural and in German — `Kunden`, `Anlagen`, `Kontakte`, etc.

---

## 4. Layout & Spacing

All values in this section are derived from the live codebase and verified across every entity. Do not deviate from these numbers without updating this document.

---

### 4.1 Root layout structure

The application shell is a full-viewport, non-scrolling column:

```
<div className="h-screen flex flex-col bg-background overflow-hidden">
  <header>  {/* navigation bar — h-14, §4.2 */}
  <main className="flex-1 flex flex-col min-h-0 relative">
    {/* page content — §4.3 */}
  </main>
</div>
```

`overflow-hidden` on the root prevents the outer page from ever scrolling. Scrolling is always opt-in, scoped to the specific element that needs it (table wrapper or form page outer div).

---

### 4.2 Navigation bar

| Property | Value |
|---|---|
| Height | `h-14` (56 px) |
| Horizontal padding | `px-4` |
| Gap between items | `gap-4` |
| Separator height | `h-6` |
| Position | `sticky top-0 z-50` |

---

### 4.3 Page container

Two patterns — choose based on whether the page's primary content is fixed-height (table) or unbounded (form).

**List page** — table fills all remaining viewport height:

```tsx
<div className="flex flex-col flex-1 min-h-0 p-6 gap-4">
  {/* shrink-0: page header */}
  {/* flex-1 min-h-0: table component */}
</div>
```

**Form page** — scrollable, content can exceed viewport:

```tsx
<div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
  <div className="p-6 w-full">
    {/* form component */}
  </div>
</div>
```

| Property | List page | Form page |
|---|---|---|
| Padding | `p-6` directly on outer div | `p-6` on inner `w-full` div |
| Vertical gap | `gap-4` between header and table | `space-y-6` inside the `<form>` element |
| Overflow | fixed — no scroll | `overflow-y-auto` on outer div |
| `min-h-0` | required on outer div | required on outer div |

> **Why `min-h-0`?** Flex children default to `min-height: auto`, which means they expand to fit content and ignore `overflow`. `min-h-0` overrides this, allowing the child to shrink below its content size and enabling `overflow` to work as expected.

---

### 4.4 Page header block

The title block that appears above all primary content on list pages:

```tsx
<div className="shrink-0">
  <h1 className="text-2xl font-semibold">{title}</h1>
  {subtitle && (
    <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
  )}
</div>
```

| Element | Class |
|---|---|
| Wrapper | `shrink-0` — prevents the header from being compressed by the flex table below it |
| Title | `text-2xl font-semibold` |
| Subtitle gap | `mt-1.5` (6 px) |
| Subtitle style | `text-sm text-muted-foreground` |

For form pages, the header includes a back button and inline save button — see §3.12. The title and subtitle rules above still apply.

---

### 4.5 Table toolbar

Sits between the page header and the table border. Must carry `shrink-0` so the table absorbs all remaining vertical space.

```tsx
<div className="flex items-center justify-between shrink-0 pb-4 gap-3">
  <div className="flex items-center gap-2">
    {/* search input · Suchen button · pagination */}
  </div>
  <div className="flex items-center gap-2">
    {/* filter selects · new-record button */}
  </div>
</div>
```

| Property | Value |
|---|---|
| Bottom padding | `pb-4` (16 px) — space between toolbar and top table border |
| Left–right split | `justify-between` |
| Gap between the two groups | `gap-3` (12 px) |
| Gap within a group | `gap-2` (8 px) |
| Search input width | `w-64` (256 px) |
| Filter select widths | fixed per content — typically `w-[150px]` to `w-[180px]` |
| All toolbar controls height | `h-9` (36 px) — matches default `Input` and `Button` |

---

### 4.6 Table dimensions

```tsx
<div className="rounded-md border overflow-auto flex-1 min-h-0">
  <Table>…</Table>
</div>
```

| Property | Value |
|---|---|
| Wrapper classes | `rounded-md border overflow-auto flex-1 min-h-0` |
| Row height | `h-[46px]` — defined as the `ROW_HEIGHT` constant, applied to every `<TableRow>` |
| Page size | `14` rows — defined as the `PAGE_SIZE` constant |

`flex-1` makes the table wrapper fill all height not claimed by the toolbar. `overflow-auto` enables scrolling when column count overflows horizontally. Both constants (`ROW_HEIGHT`, `PAGE_SIZE`) must be updated together with the skeleton if they ever change.

---

### 4.7 Form layout

```tsx
<form className="space-y-6" noValidate>
  {/* page header block (§3.12) */}

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card>…</Card>
    <Card>…</Card>
  </div>

  {/* footer save row (§3.13) */}
</form>
```

| Property | Value |
|---|---|
| Form vertical rhythm | `space-y-6` (24 px) between header, grid, and footer |
| Card grid columns | `grid-cols-1` by default; `lg:grid-cols-2` at ≥ 1024 px |
| Card grid gap | `gap-6` (24 px) |
| `CardContent` field gap | `space-y-4` (16 px) between field rows |
| Label-to-input gap | `space-y-1.5` (6 px) within each field row |

---

### 4.8 Control dimensions

| Control | Height | Notes |
|---|---|---|
| `Input` | `h-9` (36 px) | shadcn default — never override |
| `Select` trigger | `h-9` (36 px) | shadcn default |
| `Textarea` | auto | grows with content |
| `Button` (default) | `h-9` (36 px) | save buttons, toolbar primary actions |
| `Button size="sm"` | `h-8` (32 px) | back button, pagination buttons |
| `Checkbox` | `h-4 w-4` (16 px) | shadcn default |

**Icons:**

| Context | Size | Spacing |
|---|---|---|
| Button leading icon | `h-4 w-4` | `mr-2` before label text |
| Button icon-only | `h-4 w-4` | no margin |
| `Loader2` spinner | `h-4 w-4 animate-spin` | `mr-2` before label text |
| Table sort arrows (`ArrowUp/Down/UpDown`) | `h-3 w-3` | `ml-1` after column label |
| Search icon inside input | `h-4 w-4` | `absolute left-2.5 top-2.5` |
| Clear (×) icon inside input | `h-4 w-4` | `absolute right-2.5 top-2.5` |

---

### 4.9 Dialog sizing

All confirmation and destructive dialogs:

```tsx
<AlertDialogContent className="max-w-sm">
```

`max-w-sm` (384 px) is the fixed width for every `AlertDialog`. Never use a wider size — dialog body text must fit in one or two sentences. If more content is needed, rethink the dialog design rather than widening it.

---

### 4.10 Spacing reference

| Token | px | Where used |
|---|---|---|
| `gap-2` / `space-x-2` | 8 px | Within a toolbar group; between icon and label text |
| `gap-3` | 12 px | Between the two toolbar groups |
| `gap-4` / `space-y-4` | 16 px | Between field rows inside a card; `gap-4` in page container |
| `gap-6` | 24 px | Between cards in form grid; between field columns in a row |
| `p-6` | 24 px | Page padding (all sides) |
| `pb-4` | 16 px | Toolbar bottom padding |
| `pb-8` | 32 px | Footer save row bottom padding |
| `mt-0.5` | 2 px | Edit form subtitle directly below `h1` |
| `mt-1` | 4 px | Inline field error paragraph below input |
| `mt-1.5` | 6 px | Subtitle below `h1` on list pages |
| `mb-2` | 8 px | Back button bottom margin before `h1` |
| `-ml-2` | −8 px | Back button left offset (aligns ghost text with `h1`) |
| `space-y-1.5` | 6 px | Label-to-input gap within a field row |
| `space-y-4` | 16 px | Between field rows within a card |
| `space-y-6` | 24 px | Between form sections (header → grid → footer) |
| `h-[46px]` | 46 px | Table row height (`ROW_HEIGHT`) |
| `h-14` | 56 px | Navigation bar height |
| `h-9` | 36 px | Default input / button height |
| `h-8` | 32 px | Small button height (`size="sm"`) |
| `h-6` | 24 px | Nav separator height |
| `w-64` | 256 px | Search input width in table toolbar |

---

## 5. Scope note

This document covers desktop viewport usage. Responsive / mobile behavior is not currently specified — AWADI is a desktop-first application. Any future mobile work requires a separate addendum to this document before implementation begins.
