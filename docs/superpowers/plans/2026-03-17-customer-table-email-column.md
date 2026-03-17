# Customer Table Email Column — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "E-Mail" column to the customer data table after "Telefon", with sort support and "—" fallback for missing values.

**Architecture:** Single file change. `email` is already in the `Kunde` type and fetched from the `kunden_details` view. `email` is already a valid `SortField`. Only the table rendering needs updating.

**Tech Stack:** React 19, shadcn/ui Table, TypeScript.

---

## Files

| Action | File | Change |
|--------|------|--------|
| Modify | `components/dashboard/customer-table.tsx` | Add E-Mail column header, skeleton cell, data cell; bump COLSPAN |

---

## Chunk 1: Add email column

### Task 1: Add E-Mail column to customer-table.tsx

**Files:**
- Modify: `components/dashboard/customer-table.tsx`

There are four locations to update, all in the same file:

---

**Location 1 — COLSPAN (line 174)**

- [ ] **Step 1: Bump COLSPAN from 10 to 11**

```tsx
const COLSPAN = 11;
```

---

**Location 2 — Table header (after line 370, before the actions `<TableHead />`)**

Current (lines 362–371):
```tsx
              <TableHead>
                <button
                  onClick={() => handleSort("telefonnr")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Telefon
                  <SortIcon field="telefonnr" />
                </button>
              </TableHead>
              <TableHead className="w-[90px]" />
```

- [ ] **Step 2: Insert E-Mail header between Telefon and the actions column**

Replace with:
```tsx
              <TableHead>
                <button
                  onClick={() => handleSort("telefonnr")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Telefon
                  <SortIcon field="telefonnr" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("email")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  E-Mail
                  <SortIcon field="email" />
                </button>
              </TableHead>
              <TableHead className="w-[90px]" />
```

---

**Location 3 — Loading skeleton row (after line 388, before the empty actions cell)**

Current (lines 387–390):
```tsx
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell />
```

- [ ] **Step 3: Insert email skeleton cell after the phone skeleton**

Replace with:
```tsx
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell />
```

---

**Location 4 — Data row (after line 441, before the actions cell)**

Current (lines 441–442):
```tsx
                    <TableCell className="text-muted-foreground">{kunde.telefonnr}</TableCell>
                    <TableCell className="text-right">
```

- [ ] **Step 4: Insert email data cell after the phone cell**

Replace with:
```tsx
                    <TableCell className="text-muted-foreground">{kunde.telefonnr}</TableCell>
                    <TableCell className="text-muted-foreground">{kunde.email ?? "—"}</TableCell>
                    <TableCell className="text-right">
```

---

- [ ] **Step 5: Verify the build compiles without errors**

```bash
cd D:/git/awadi-web && pnpm build
```

Expected: build completes successfully with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/customer-table.tsx
git commit -m "feat: add email column to customer table"
```
