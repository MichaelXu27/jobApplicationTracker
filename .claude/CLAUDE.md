# Job Application Tracker

Full-stack Next.js 14 app (App Router) for tracking job applications.

## Stack
- **Framework**: Next.js 14 App Router
- **Language**: TypeScript
- **Database**: SQLite (Prisma ORM) — swap `provider` in `prisma/schema.prisma` for PostgreSQL
- **Auth**: NextAuth.js v4 (credentials/JWT)
- **Styling**: Tailwind CSS
- **Validation**: Zod + react-hook-form
- **Toasts**: react-hot-toast

## Quick Start

```bash
npm install
cp .env.example .env.local        # edit NEXTAUTH_SECRET
npx prisma db push                  # create the SQLite DB
npm run db:seed                     # (optional) load demo data
npm run dev                         # http://localhost:3000
```

Demo account (after seeding): `demo@example.com` / `password123`

## Key Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npx prisma db push` | Apply schema to DB |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio GUI |
| `npm run db:reset` | Reset + re-seed |

## Project Structure

```
src/
├── app/
│   ├── (auth)/          login, register pages
│   ├── (dashboard)/     dashboard page (auth-protected layout)
│   ├── api/             NextAuth, register, applications CRUD
│   ├── layout.tsx       root layout + Toaster provider
│   └── providers.tsx    SessionProvider wrapper
├── components/
│   ├── ApplicationChart.tsx        Lollipop SVG timeline chart
│   ├── ApplicationForm.tsx         Create / edit modal form
│   ├── ApplicationProgressCard.tsx 3-stat card with mini bar charts
│   ├── ApplicationTable.tsx        Filterable / sortable / paginated table
│   ├── CompanyAvatar.tsx           Deterministic colored company initial
│   ├── DeleteConfirmDialog.tsx     Accessible delete confirmation modal
│   ├── InterviewPipelineCard.tsx   Active interviews + tip card
│   ├── Navbar.tsx                  Top navigation bar
│   ├── RecentApplicationsPanel.tsx Right-side expandable application list
│   └── StatusBadge.tsx             Applied / Interviewing / Denied pill
├── lib/
│   ├── auth.ts           NextAuth config + getSession() helper
│   ├── db.ts             Prisma singleton (hot-reload safe)
│   └── validations.ts    Zod schemas (shared server + client)
└── types/
    ├── index.ts          Application, ApplicationStatus, etc.
    └── next-auth.d.ts    Extend session type with user.id
```

## Auth Flow
1. Register → POST /api/register → bcrypt hash → create User → redirect /login
2. Login → NextAuth credentials → bcrypt compare → JWT session (30 days)
3. Dashboard layout server component calls `getSession()` → redirects to /login if null
4. All API routes call `getSession()` → return 401 if null

## Ownership Guard
Every application API handler enforces `application.userId === session.user.id`.

## Status Values
`APPLIED` | `INTERVIEWING` | `DENIED` — enforced by Zod + API layer.
SQLite doesn't support native enums so status is stored as String in Prisma.
