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
- **Charts**: Chart.js + react-chartjs-2 (pie chart), custom SVG (lollipop timeline)

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
│   │   ├── api/
│   │   ├── auth/        NextAuth
│   │   ├── register/    User registration
│   │   └── applications/
│   │       ├── route.ts         List (GET, limit 10000) + Create (POST)
│   │       ├── [id]/route.ts    Get / Update / Delete single application
│   │       ├── bulk/route.ts    POST — bulk insert from xlsx import
│   │       └── all/route.ts     DELETE — remove all applications for current user
│   ├── layout.tsx       root layout + Toaster provider
│   └── providers.tsx    SessionProvider wrapper
├── components/
│   ├── ApplicationChart.tsx        Lollipop SVG timeline chart (week/month periods)
│   ├── ApplicationForm.tsx         Create / edit modal form (custom StatusDropdown + date picker)
│   ├── ApplicationPieChart.tsx     Chart.js doughnut chart — Applied/Interviewing/Denied counts
│   ├── ApplicationProgressCard.tsx 3-stat card with mini bar charts
│   ├── ApplicationTable.tsx        Filterable / sortable / paginated table (client-side)
│   ├── CompanyAvatar.tsx           Deterministic colored company initial
│   ├── DeleteConfirmDialog.tsx     Accessible delete confirmation modal
│   ├── DashboardStats.tsx          Top-level stat cards
│   ├── InterviewPipelineCard.tsx   Active interviews + tip card
│   ├── Navbar.tsx                  Top nav — xlsx import, xlsx export, dev clear-all button
│   ├── RecentApplicationsPanel.tsx Right-side panel showing 4 most recent applications
│   ├── StatusBadge.tsx             Applied / Interviewing / Denied pill
│   └── StatusDropdown.tsx          Shared themed status dropdown (used in form + table filter)
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

## Dashboard Data Flow
- `fetchAll` fetches up to 10 000 applications once on mount and after any CRUD/import/clear.
- All table filtering, sorting, searching, and pagination are computed **client-side** via `useMemo` — no additional API calls when toggling sort or changing filters.
- Cross-component events (`applications-imported`, `applications-cleared`) fired from `Navbar.tsx` trigger `fetchAll` in `dashboard/page.tsx`.

## Navbar Utilities
- **Import**: parses an `.xlsx` file client-side (SheetJS), normalises column headers, infers dates without year (future date → previous year), falls back to any unknown column as status source, POSTs to `/api/applications/bulk`.
- **Export**: fetches all applications and writes them to an `.xlsx` with columns `Company | Role | Location | Date Applied | Notes | Status` — same format accepted by import.
- **Clear All** (dev): DELETEs all applications for the current user via `/api/applications/all`.

## ApplicationTable
- Fully client-side: filter by status, full-text search (jobTitle / company / location), sort oldest/newest, paginate (15 per page).
- Uses shared `StatusDropdown` component for the status filter, matching the style used in `ApplicationForm`.
