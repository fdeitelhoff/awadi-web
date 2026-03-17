# Version Display in User Menu

**Date:** 2026-03-17
**Status:** Approved

## Summary

Display the app version and short git commit hash in the user menu dropdown, at the bottom, in small muted text. Format: `v1.0.0 (abc1f23)`.

## Approach

Build-time injection via `next.config.ts`. The config reads the version from `package.json` and the short git commit hash via `child_process.execSync`, then injects both as `NEXT_PUBLIC_*` env vars. The user menu reads them via `process.env`.

## Changes

### `package.json`
Add `"version": "0.1.0"` field.

### `next.config.ts`
- Import `package.json` (requires `resolveJsonModule: true`)
- Run `git rev-parse --short HEAD` wrapped in try/catch (falls back to `"unknown"`)
- Add `env` block to `nextConfig`:
  ```ts
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_GIT_COMMIT: gitHash,
  }
  ```

### `tsconfig.json`
Ensure `"resolveJsonModule": true` is present under `compilerOptions`.

### `components/dashboard/user-menu.tsx`
Add at the bottom of the `DropdownMenuContent`, after the Logout item:
```
├── Separator
└── DropdownMenuLabel  →  "v0.1.0 (abc1f23)"  [text-xs, text-muted-foreground, font-normal]
```

## Non-Goals
- Clickable version label
- Changelog or release notes link
- Runtime version fetching
