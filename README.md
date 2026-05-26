# FitRix

Multi-tenant SaaS fitness coaching platform.

## Stack
- **Monorepo:** Turborepo + pnpm workspaces
- **Web (Admin + Coach portal + Client):** Next.js 15, TypeScript, Tailwind CSS
- **API:** NestJS 10, Prisma 5, PostgreSQL
- **Auth:** Clerk

## Getting started

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env

pnpm --filter @fitrix/api prisma generate
pnpm --filter @fitrix/api prisma migrate dev --name init

pnpm dev
```

## Structure
```
apps/
  web/    Next.js 15 coach/admin portal/client portal
  api/    NestJS API
packages/
  ui/     Shared UI components
  types/  Shared TS interfaces
  config/ Shared tsconfig / tailwind / eslint
```
