# Acme Invoicing Dashboard

A full-stack invoicing dashboard built with the **Next.js App Router**. It started as the official [Next.js Learn course](https://nextjs.org/learn) project, which I completed, then extended with patterns I use in production frontend work: session handling, role-based access, a reusable data-table system, and safer mutations.

**Demo accounts** (password `123456`):

| Role   | Email                 | Can                                   |
| ------ | --------------------- | ------------------------------------- |
| Admin  | `user@nextmail.com`   | View, create, edit and delete invoices |
| Viewer | `viewer@nextmail.com` | View only                             |

## What I added beyond the course

### Session handling
- **Idle timeout with a countdown.** After a period of inactivity (15 minutes by default), a modal warns "you'll be signed out in 60 seconds", then signs the user out and tells them why on the login page.
  - Activity in any open tab keeps every tab alive, using `localStorage` events.
  - Passive mouse movement doesn't dismiss the warning; the user has to choose "Stay signed in".
  - It compares timestamps instead of counting ticks, so it stays correct when the browser throttles background tabs or the laptop wakes from sleep.
- **Session-expired modal.** If a session runs out while a form or delete button is in use, the user gets one blocking modal ("Your session has expired → Sign in again") instead of a confusing error. Nothing is saved silently.
- Server actions are deliberately let through the route guard so they can answer "session expired" themselves. Redirecting an action request to `/login` makes the browser receive HTML where it expects an action result, and it fails with a generic error.

### Role-based access (admin / viewer)
- One permissions map (`app/lib/permissions.ts`) is the single source of truth. The route guard, the server actions and the UI all call `can(role, permission)`.
- **Enforced on the server.** Every mutating server action checks the session and role, because hiding a button isn't security.
- Viewers who open an admin-only URL directly are redirected with a toast explaining why.
- The sidebar is built from one list of items, each declaring the permission it needs, so each role sees its own menu without separate menus to keep in sync.

### Reusable data table and filters
- **`DataTable<T>`**: a typed, server-rendered table. A page describes its columns as data, and the table handles layout, a card view on mobile, empty states and accessibility. The invoices and customers pages both use it.
- **`FilterBar`**: search plus select filters, all stored in the URL. A filtered view can be refreshed, bookmarked or shared, and any filter change resets to page 1. "Clear all" appears only when something is filtered.
- **Server-side status filter**, with the search and count queries built from one shared `WHERE` clause so the rows and the "Showing 7–12 of 15 invoices" summary can't disagree.
- Out-of-range page numbers (a stale `?page=9` after filtering) are clamped instead of showing an empty table.

### Safer mutations and feedback
- **Delete asks for confirmation** in an accessible modal built on the native `<dialog>` element, and ignores double clicks while a delete is in flight.
- **Toasts** confirm create, update and delete. Redirecting actions pass a `?toast=` key, which is shown once and removed from the URL so a refresh doesn't repeat it.
- **Money is stored in cents without floating-point drift**: `19.99 * 100` is `1998.9999…` in JavaScript, so amounts are rounded explicitly.
- Animated count-up stat cards, which respect `prefers-reduced-motion`.

### Housekeeping
- One shared database client instead of one per file; SSL is on for hosted databases and off for a local Postgres.
- The seed route is idempotent (safe to run twice) and needs a secret in production, so a deployed demo can't be reseeded by anyone who finds the URL.

## Course fundamentals covered

App Router layouts and route groups · Server Components and Server Actions · streaming with Suspense and skeletons · URL-driven search and pagination · forms with Zod validation · authentication with NextAuth.js (credentials, bcrypt) · PostgreSQL · Tailwind CSS.

## Tech

Next.js 16 · React 19 · TypeScript · Tailwind CSS · NextAuth.js v5 · Zod · PostgreSQL · Sonner

## Running locally

You need a PostgreSQL database: a free one from [Neon](https://neon.tech), or a local Postgres.

```bash
pnpm install
cp .env.example .env    # set POSTGRES_URL and AUTH_SECRET (openssl rand -base64 32)
pnpm dev
```

Seed the demo data by opening http://localhost:3000/seed once, then sign in at http://localhost:3000/login.

To see the idle timeout quickly, set `IDLE_TIMEOUT_MINUTES=0.5` in `.env`. The warning appears after 15 seconds and you're signed out at 30.

## Project layout

```
app/lib/permissions.ts         roles and permissions (single source of truth)
app/lib/actions.ts             server actions, each checking session and role
app/lib/data.ts                queries, incl. shared filter clause
app/ui/data-table/             DataTable<T>, ResultsSummary, FilterBar
app/ui/session/                idle timer + session-expired modal
app/ui/modal.tsx               accessible <dialog>-based modal
auth.config.ts                 route guard and role on the session
```
