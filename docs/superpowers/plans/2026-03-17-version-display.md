# Version Display in User Menu — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display the app version and short git commit hash (e.g. `v0.1.0 (abc1f23)`) at the bottom of the user menu dropdown.

**Architecture:** `next.config.ts` reads the version from `package.json` and the git commit hash at build time, injects both as `NEXT_PUBLIC_*` env vars. `user-menu.tsx` (server component) reads them via `process.env` and renders them as a non-interactive label at the bottom of the dropdown.

**Tech Stack:** Next.js 15 (TypeScript config), Node.js `child_process`, React 19 server components, shadcn/ui DropdownMenu.

---

## Files

| Action | File | Change |
|--------|------|--------|
| Modify | `package.json` | Add `"version": "0.1.0"` field |
| Modify | `next.config.ts` | Import `package.json` + `execSync`, inject `NEXT_PUBLIC_APP_VERSION` and `NEXT_PUBLIC_GIT_COMMIT` |
| Modify | `components/dashboard/user-menu.tsx` | Add separator + version label after `<LogoutMenuItem />` |

`tsconfig.json` already has `"resolveJsonModule": true` — no change needed.

---

## Chunk 1: Build-time version injection

### Task 1: Add version to package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add the version field**

In `package.json`, add `"version": "0.1.0"` as the first field (before `"private"`):

```json
{
  "version": "0.1.0",
  "private": true,
  ...
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: set initial app version to 0.1.0"
```

---

### Task 2: Inject version and git hash via next.config.ts

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Update the config**

Replace the entire contents of `next.config.ts` with:

```ts
import type { NextConfig } from "next";
import { execSync } from "child_process";
import pkg from "./package.json";

let gitHash = "unknown";
try {
  gitHash = execSync("git rev-parse --short HEAD").toString().trim();
} catch {
  // git not available (e.g. some CI environments)
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_GIT_COMMIT: gitHash,
  },
};

export default nextConfig;
```

- [ ] **Step 2: Verify the build compiles without errors**

```bash
pnpm build
```

Expected: build succeeds with no TypeScript errors. The `.next` build output should complete normally.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: inject app version and git commit hash at build time"
```

---

## Chunk 2: Version display in user menu

### Task 3: Render version label in user menu

**Files:**
- Modify: `components/dashboard/user-menu.tsx`

Current bottom of `DropdownMenuContent` (lines 58–60):
```tsx
<DropdownMenuSeparator />
<LogoutMenuItem />
```

- [ ] **Step 1: Add separator + version label after LogoutMenuItem**

Replace those two lines with:

```tsx
        <DropdownMenuSeparator />
        <LogoutMenuItem />
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
          v{process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown"} ({process.env.NEXT_PUBLIC_GIT_COMMIT ?? "unknown"})
        </DropdownMenuLabel>
```

No new imports needed — `DropdownMenuSeparator` and `DropdownMenuLabel` are already imported.

- [ ] **Step 2: Verify visually**

```bash
pnpm dev
```

Open `http://localhost:3000`, click the user avatar in the top-right. The dropdown should show at the bottom:

```
────────────────
v0.1.0 (abc1f23)
```

in small muted text below the logout item.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/user-menu.tsx
git commit -m "feat: display app version and git hash in user menu"
```
