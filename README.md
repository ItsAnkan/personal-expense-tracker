# Personal Expense Tracker

Ledger-first personal finance application focused on financial correctness, overspending awareness, and mobile usability.

## Current status

This repository currently includes **Phase 1 (Foundation)**, **Phase 2 (Accounting Core)**, **Phase 3 (Core UI + CRUD flows)**, and **Phase 4 (Analytics + Budgets)**:

- Next.js + TypeScript + Tailwind + shadcn/ui setup
- MongoDB + Prisma schema setup
- Seed script with realistic 3-month demo data
- Basic authentication using NextAuth Credentials
- PWA manifest + icon setup
- Pure domain accounting engine (`domain/accounting/*`) with deterministic ledger calculations
- Transaction validation/classification primitives (`domain/transactions/*`)
- Automated accounting tests covering expense/income/transfer/credit-card/refund/edit/delete/month boundaries/opening balances
- Authenticated app shell (`app/(app)/layout.tsx`) with desktop + mobile navigation
- Main sections implemented: Dashboard, Transactions, Accounts, Categories, Monthly History, Settings
- Transaction add/edit/delete wired through server actions and accounting validation use-cases
- Accounts and categories CRUD foundation with server-side authorization
- Dashboard analytics with Recharts:
  - spending by category (donut)
  - daily spending trend
  - monthly income vs expense comparison
  - category trend over multiple months
- Budget system foundation:
  - overall monthly budget
  - category monthly budgets
  - deterministic overspending / near-limit indicators
  - remaining budget calculations

## Architecture (high-level)

- `app/`: Next.js App Router pages and API routes
- `lib/`: infrastructure (Prisma client, auth config, shared utils)
- `prisma/`: schema and seed data
- `domain/` (planned in next phase): accounting engine and business rules (UI-independent)
- `server/use-cases/` (planned): application-layer orchestration over domain + repositories

## Tech stack

- TypeScript
- Next.js (App Router)
- React
- Tailwind CSS
- shadcn/ui
- MongoDB
- Prisma ORM
- Zod
- Recharts
- NextAuth

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB 6+ (Atlas or self-hosted)

## Environment variables

Copy and edit:

```bash
cp .env.example .env
```

Required:

- `DATABASE_URL`: MongoDB connection string
- `NEXTAUTH_URL`: App URL (local: `http://localhost:3000`)
- `NEXTAUTH_SECRET`: long random secret
- `DEMO_USER_EMAIL`: seeded demo login email
- `DEMO_USER_PASSWORD`: seeded demo login password

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Push Prisma schema (development):

   ```bash
   npm run db:migrate:dev
   ```

3. Seed demo data:

   ```bash
   npm run db:seed
   ```

4. Start app:

   ```bash
   npm run dev
   ```

5. Open:
   - App: `http://localhost:3000`
   - Sign in: `http://localhost:3000/sign-in`

## Prisma commands

- Generate client: `npm run db:generate`
- Push schema (dev): `npm run db:migrate:dev`
- Push schema (deploy): `npm run db:migrate:deploy`
- Seed: `npm run db:seed`
- Studio: `npm run db:studio`

## Seed data details

The seed script creates:

- Demo user
- Accounts: HDFC Savings, ICICI Savings, Cash, HDFC Credit Card
- Full category tree (including subcategories)
- Transactions across June/July/August 2026:
  - Salary
  - Rent
  - Groceries
  - Restaurants
  - Shopping
  - Fuel
  - Credit-card purchases
  - Credit-card payment
  - Transfers
  - Refund
- Example monthly and category budgets

All seed records are marked as demo in notes where relevant (`[DEMO]`).

## Build and quality checks

- Lint: `npm run lint`
- Tests: `npm run test`
- Production build: `npm run build`

## Deployment

### Vercel (Next.js)

1. Push repository to GitHub.
2. Import into Vercel.
3. Set environment variables from `.env.example`.
4. Set build command: `npm run build`.
5. Set install command: `npm install`.

### MongoDB (Atlas or self-hosted)

1. Create a MongoDB database.
2. Copy the connection URL to `DATABASE_URL`.
3. Push schema to production:

   ```bash
   npm run db:migrate:deploy
   ```

4. Optionally seed initial data:

   ```bash
   npm run db:seed
   ```

## PWA installation

- Manifest: `public/manifest.webmanifest`
- Icons: `public/icons/*`
- `next-pwa` is configured in `next.config.ts`
- Service worker is active in production builds

Install from browser menu on Android/desktop when served over HTTPS (or localhost for local testing).

## Security and privacy notes

- Server-side auth and credential validation
- Passwords stored as bcrypt hashes
- No client-side trust for sensitive operations
- No hardcoded secrets

## Future SMS architecture (planned)

SMS ingestion is intentionally deferred until core accounting is stable. Planned flow:

1. Parse SMS to candidate transaction rows
2. Validate + classify in import pipeline
3. Show review UI (`Accept / Edit / Ignore`)
4. Only confirmed rows post to ledger

Raw SMS forwarding to third-party AI services is out-of-scope by default.
