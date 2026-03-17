# Customer Table: Email Column

**Date:** 2026-03-17
**Status:** Approved

## Summary

Add an "E-Mail" column to the customer data table, positioned after "Telefon". Display `kunde.email` with a `"—"` fallback for missing values. Make it sortable (email is already a valid `SortField`).

## Changes

### `components/dashboard/customer-table.tsx` only

- Add sortable "E-Mail" column header after "Telefon" in the header row
- Add `<TableCell>{kunde.email ?? "—"}</TableCell>` after the phone cell in the data row
- Update `COLSPAN` from `10` to `11`

## Non-Goals

- No data layer changes (email already fetched via `kunden_details`)
- No type changes (email already in `Kunde` and `SortField`)
- No secondary email column
