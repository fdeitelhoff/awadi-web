# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AWADI is a Next.js + Supabase starter kit with cookie-based authentication, built with React 19, TypeScript, and shadcn/ui components.

## Commands

```bash
pnpm dev          # Start development server (localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## Architecture

### Directory Structure

- `app/` - Next.js App Router pages and layouts
  - `app/auth/` - Authentication pages (login, sign-up, forgot-password, etc.)
  - `app/protected/` - Routes requiring authentication
- `components/` - React components
  - `components/ui/` - shadcn/ui base components (button, input, card, etc.)
- `lib/` - Utilities and Supabase clients
  - `lib/supabase/client.ts` - Browser-side Supabase client
  - `lib/supabase/server.ts` - Server-side Supabase client with cookie handling
  - `lib/supabase/proxy.ts` - Middleware for session persistence

### Authentication Flow

1. Forms use the client-side Supabase client (`lib/supabase/client.ts`)
2. Middleware (`proxy.ts`) validates sessions on every request
3. Unauthenticated users are redirected to `/auth/login`
4. Protected routes are any path not starting with `/` (root) or `/auth`

### Styling & Design System

- Tailwind CSS with CSS variables for theming (HSL colors)
- Dark mode via `next-themes` with class strategy
- shadcn/ui configured with "new-york" style

**AWADI Brand Colors** (available as `awadi-*` classes):
- `awadi-navy` - Dark slate blue from logo text (primary brand color)
- `awadi-blue` - Medium blue from logo circles
- `awadi-indigo` - Lighter indigo accent
- `awadi-slate` - Grayish-blue for backgrounds

**Status Colors** (available as utility classes):
- `success` / `success-foreground`
- `warning` / `warning-foreground`
- `info` / `info-foreground`

Usage: `bg-awadi-navy`, `text-success`, `border-awadi-blue`, etc.

### Path Aliases

- `@/*` maps to the project root (e.g., `@/components/ui/button`)

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=[Supabase project URL]
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[Supabase anon/publishable key]
```

## Adding shadcn/ui Components

The project uses shadcn/ui with the "new-york" style. Add components with:
```bash
npx shadcn@latest add [component-name]
```
