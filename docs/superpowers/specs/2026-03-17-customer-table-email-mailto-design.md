# Customer Table: Clickable Email (mailto)

**Date:** 2026-03-17
**Status:** Approved

## Summary

Make the email cell in the customer table a `mailto:` link that opens the default email application. Rows are already clickable (navigate to customer detail), so `stopPropagation` is required to prevent double-firing.

## Change

### `components/dashboard/customer-table.tsx` only

Replace the email data cell with:

```tsx
<TableCell className="text-muted-foreground">
  {kunde.email ? (
    <a
      href={`mailto:${kunde.email}`}
      onClick={(e) => e.stopPropagation()}
      className="hover:underline"
    >
      {kunde.email}
    </a>
  ) : "—"}
</TableCell>
```

## Non-Goals
- No color change on the link (hover:underline only)
- No tooltip or icon
- No secondary email linkage
