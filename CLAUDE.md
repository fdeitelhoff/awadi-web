# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AWADI is a maintenance software for small wastewater treatment plants (Kleinkläranlagen). It enables quick and easy maintenance scheduling, documentation, and reporting to authorities for decentralized wastewater systems.

Built with Next.js, React 19, TypeScript, Supabase, and shadcn/ui.

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
  - `app/(dashboard)/` - Main dashboard (route group, protected)
    - `page.tsx` - Main maintenance planning dashboard at `/`
    - `master-data/` - Master data management at `/master-data`
  - `app/auth/` - Authentication pages (login, sign-up, forgot-password, etc.)
  - `app/protected/` - Additional protected routes
- `components/` - React components
  - `components/dashboard/` - Dashboard-specific components
    - `dashboard-nav.tsx` - Main navigation bar (server component)
    - `nav-items.tsx` - Navigation links (client component)
    - `search-input.tsx` - Search functionality
    - `maintenance-calendar.tsx` - 4-week rolling calendar view
    - `maintenance-task-card.tsx` - Individual task display with traffic light status
    - `tickets-sidebar.tsx` - Open service tickets/orders
    - `status-badge.tsx` - Scheduling and confirmation status indicators
  - `components/ui/` - shadcn/ui base components
- `lib/` - Utilities and Supabase clients
  - `lib/supabase/` - Supabase client configuration
  - `lib/types/maintenance.ts` - TypeScript types for maintenance domain
  - `lib/data/mock-data.ts` - Mock data for development

### Authentication Flow

1. Forms use the client-side Supabase client (`lib/supabase/client.ts`)
2. Middleware (`proxy.ts`) validates sessions on every request
3. Unauthenticated users are redirected to `/auth/login`
4. All routes are protected except `/auth/*` paths

### Dashboard Features

- **Maintenance Calendar**: 4-week rolling view with selectable range (1-4 weeks)
- **Traffic Light System**: Visual confirmation status (pending/tentative/confirmed/cancelled)
- **Scheduling Status**: Tracks customer contact progress (not contacted → email sent → confirmed)
- **Service Tickets**: Sidebar with open tickets sorted by priority
- **Task Management**: Confirm/cancel appointments, technician assignment

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
