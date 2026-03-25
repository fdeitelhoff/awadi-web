/**
 * E2E tests for the customer data table (/master-data/customers)
 *
 * Coverage: UI/UX standards
 *   §2.5  — "Neuer Kunde" button uses success variant (green) and navigates correctly
 *   §2.6  — Destructive delete: AlertDialog appears, "Abbrechen" cancels without deleting
 *   §2.7  — Empty state: "Keine Kunden gefunden." shown when search yields no results
 *   §2.10 — Search keyboard shortcuts: Enter triggers search, Escape clears input
 *   §3.9  — Pagination: 4 buttons with correct German aria-labels
 *   §3.15 — Clickable table rows navigate to the customer detail page
 *   §3.17 — Heading shows total record count in "Kunden (N)" format
 */

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/master-data/customers");
  // Wait for the table to finish loading (skeleton disappears)
  await expect(
    page.getByRole("cell", { name: "Keine Kunden gefunden." }).or(
      page.locator("tbody tr:not([key^='sk-'])").first()
    )
  ).toBeVisible({ timeout: 10_000 });
});

// ── §3.17 — Record count in heading ─────────────────────────────────────────

test("§3.17 heading shows total count in 'Kunden (N)' format", async ({ page }) => {
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  // Matches "Kunden (0)" up to "Kunden (1.234)" (de-DE with dot as thousands separator)
  await expect(heading).toHaveText(/^Kunden \(\d[\d.]*\)$/);
});

// ── §2.5 — "Neuer Kunde" button ──────────────────────────────────────────────

test("§2.5 'Neuer Kunde' button has success variant styling", async ({ page }) => {
  const btn = page.getByRole("button", { name: "Neuer Kunde" });
  await expect(btn).toBeVisible();
  // The shadcn Button variant="success" applies bg-success to the element
  const classList = await btn.getAttribute("class");
  expect(classList).toContain("success");
});

test("§2.5 'Neuer Kunde' button navigates to the create page", async ({ page }) => {
  await page.getByRole("button", { name: "Neuer Kunde" }).click();
  await expect(page).toHaveURL(/\/master-data\/customers\/new$/);
});

// ── §2.10 — Search keyboard shortcuts ───────────────────────────────────────

test("§2.10 Enter key in search input triggers the search", async ({ page }) => {
  const input = page.getByPlaceholder("Kunden suchen…");
  await input.fill("__this_will_match_nothing__");
  await input.press("Enter");
  await expect(
    page.getByRole("cell", { name: "Keine Kunden gefunden." })
  ).toBeVisible({ timeout: 8_000 });
});

test("§2.10 Escape key clears the search input", async ({ page }) => {
  const input = page.getByPlaceholder("Kunden suchen…");
  await input.fill("something");
  await expect(input).toHaveValue("something");
  await input.press("Escape");
  await expect(input).toHaveValue("");
});

// ── §2.7 — Empty / zero-result state ────────────────────────────────────────

test("§2.7 searching with no match shows 'Keine Kunden gefunden.'", async ({ page }) => {
  const input = page.getByPlaceholder("Kunden suchen…");
  await input.fill("XYZZY_NONEXISTENT_9999");
  await page.getByRole("button", { name: "Suchen" }).click();
  await expect(
    page.getByRole("cell", { name: "Keine Kunden gefunden." })
  ).toBeVisible({ timeout: 8_000 });
});

// ── §2.6 — Destructive delete dialog ────────────────────────────────────────

test("§2.6 clicking Löschen opens the delete confirmation dialog", async ({ page }) => {
  const firstDeleteBtn = page.getByRole("button", { name: "Löschen" }).first();

  // Only run if there is at least one row to delete
  if (!(await firstDeleteBtn.isVisible())) {
    test.skip();
    return;
  }

  await firstDeleteBtn.click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Kunde löschen?" })
  ).toBeVisible();
});

test("§2.6 'Abbrechen' in the delete dialog closes it without deleting", async ({ page }) => {
  const firstDeleteBtn = page.getByRole("button", { name: "Löschen" }).first();

  if (!(await firstDeleteBtn.isVisible())) {
    test.skip();
    return;
  }

  // Count rows before
  const rowsBefore = await page.locator("tbody tr[class*='cursor-pointer']").count();

  await firstDeleteBtn.click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Abbrechen" }).click();

  // Dialog must be closed
  await expect(page.getByRole("alertdialog")).not.toBeVisible();

  // Row count must be unchanged
  const rowsAfter = await page.locator("tbody tr[class*='cursor-pointer']").count();
  expect(rowsAfter).toBe(rowsBefore);
});

// ── §3.9 — Pagination buttons ────────────────────────────────────────────────

test("§3.9 pagination buttons have correct German aria-labels", async ({ page }) => {
  const pagination = page.locator("div").filter({
    has: page.getByRole("button", { name: "Erste Seite" }),
  }).first();

  // Only assert if pagination is rendered (requires > PAGE_SIZE records)
  if (!(await pagination.isVisible())) {
    test.skip();
    return;
  }

  await expect(page.getByRole("button", { name: "Erste Seite" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Vorherige Seite" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Nächste Seite" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Letzte Seite" })).toBeVisible();
});

test("§3.9 'Erste Seite' and 'Vorherige Seite' are disabled on page 1", async ({ page }) => {
  if (!(await page.getByRole("button", { name: "Erste Seite" }).isVisible())) {
    test.skip();
    return;
  }

  await expect(page.getByRole("button", { name: "Erste Seite" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Vorherige Seite" })).toBeDisabled();
});

// ── §3.15 — Clickable rows navigate to detail page ──────────────────────────

test("§3.15 clicking a table row navigates to the customer detail page", async ({ page }) => {
  const firstDataRow = page.locator("tbody tr[class*='cursor-pointer']").first();

  if (!(await firstDataRow.isVisible())) {
    test.skip();
    return;
  }

  await firstDataRow.click();
  await expect(page).toHaveURL(/\/master-data\/customers\/\d+$/);
});
