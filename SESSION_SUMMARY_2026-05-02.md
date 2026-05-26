# FitRix Session Summary (Through May 2, 2026)

This document captures what was done across setup, debugging, data fixes, role separation, admin features, and local-development workflow.

## 1) Project Run/Startup Clarification

Confirmed there are two top-level projects:

- `C:\FinalProject_FitRix\fitrix` (main monorepo)
- `C:\FinalProject_FitRix\fitrix-landing-page` (separate app)

Main app workflow is in `fitrix`:

```powershell
cd C:\FinalProject_FitRix\fitrix
pnpm install
pnpm --filter @fitrix/api prisma generate
pnpm --filter @fitrix/api prisma migrate dev
pnpm dev
```

Expected URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api/v1`

## 2) Docker/Postgres Clarification

Two containers were found:

- `fitrix-pg` (running, active DB)
- `fitrix-db` (stopped, duplicate mapping)

Both mapped `5432:5432`, but only running container owns the port.

Important behavior:

- Docker Desktop clicking `5432:5432` opens browser, but Postgres is not HTTP.
- Browser error on `http://localhost:5432` is expected (`ERR_EMPTY_RESPONSE`).
- DB must be accessed via `psql`, pgAdmin, DBeaver, etc.

## 3) Role and Identity Debugging (Admin vs Coach)

### Root cause discovered

- Roles are stored in local `User.role`.
- Coach capabilities are tied to `CoachProfile`.
- Browser tabs in same profile share Clerk session, which can make account switching appear mixed.

### Verified DB state and fixed transitions

We audited `User` and `CoachProfile` directly in DB and fixed role ownership:

- `veilsendu@gmail.com` became `ADMIN` only.
- Coach-owned data (programs/clients) transferred to `harhsu9souls@gmail.com`.
- Real Clerk ID mismatch for coach account was fixed.

Final verified state:

- `veilsendu@gmail.com` => `ADMIN`, no coach profile
- `harhsu9souls@gmail.com` => `COACH`, owns coach profile/data

## 4) Data Transfer and Clerk ID Repair

### What was wrong

- Coach profile/data had been moved to `harhsu9souls@gmail.com`, but that user row had placeholder clerk ID:
  - `user_PASTE_YOUR_ID_HERE`
- Real Clerk user was:
  - `user_3CT35U5s62SdjUfXyU0QOVfEKZr`

### What was fixed

- Updated the `User.clerkId` for `harhsu9souls@gmail.com` to real Clerk ID.
- Re-verified data ownership and role assignment.

Result:

- Coach dashboard correctly points to transferred data row.

## 5) Frontend Bug Fix: `programs.map is not a function`

### Symptom

On `/coach/clients` invite modal:

- Runtime error in `InviteClientModal`:
  - `programs.map is not a function`

### Root cause

- Frontend expected `/programs` response to be `Program[]`.
- API returned paginated structure: `{ data, total, page, pageSize }`.

### Fix

- Updated client modal to handle both raw array and paginated response shape safely.

File changed:

- `apps/web/src/app/coach/clients/_components/ClientsView.tsx`

## 6) Dev Invitation Flow Improvement (No Email Dependency)

### Problem

- Invitation row created but target user did not receive email.
- Local environment used `APP_URL=http://localhost:3000`.
- Localhost links are not usable directly by external users.
- Dev/provider restrictions can block external sends.

### Implemented solution (Option 1)

Added dev-friendly activation links directly in app:

- Backend now includes `activationUrl` in invitation responses in non-production.
- Coach clients UI now shows activation URL with copy/open controls.
- Pending invitation rows also include copy/open actions in dev.

Files changed:

- `apps/api/src/invitations/invitations.service.ts`
- `apps/web/src/app/coach/clients/_components/ClientsView.tsx`

## 7) Admin Platform Expansion

Implemented additional admin capabilities based on existing schema/data.

### New backend admin endpoints

Added to admin controller/service:

- `GET /admin/invitations`
- `GET /admin/billing`
- `GET /admin/audit-log`
- `GET /admin/settings`
- `GET /admin/users/:id` (support detail)

Files changed:

- `apps/api/src/admin/admin.controller.ts`
- `apps/api/src/admin/admin.service.ts`

### New admin pages

Added pages:

- `/admin/invitations`
- `/admin/billing`
- `/admin/audit-log`
- `/admin/settings`
- `/admin/support/users/[id]`

Updated:

- Admin sidebar navigation links
- Users table action for support-view drilldown

Files added/changed:

- `apps/web/src/app/admin/_components/AdminSidebarNav.tsx`
- `apps/web/src/app/admin/users/_components/UsersTable.tsx`
- `apps/web/src/app/admin/invitations/page.tsx`
- `apps/web/src/app/admin/billing/page.tsx`
- `apps/web/src/app/admin/audit-log/page.tsx`
- `apps/web/src/app/admin/settings/page.tsx`
- `apps/web/src/app/admin/support/users/[id]/page.tsx`

## 8) Security/Log Hygiene Fix

Removed server-side token logging in web API helper to avoid leaking Clerk JWTs in logs.

File changed:

- `apps/web/src/lib/api-server.ts`

## 9) Next.js Workspace/Route Stability Fix

There was repeated `Next.js inferred workspace root` warning due to multiple lockfiles.
Added explicit tracing root to improve workspace resolution:

- `outputFileTracingRoot` set in `next.config.mjs`.

File changed:

- `apps/web/next.config.mjs`

## 10) Common Runtime Issues Encountered and Resolved

### `EADDRINUSE: 3000`

Cause:

- Existing process already listening on port `3000`.

Fix:

```powershell
netstat -ano | findstr :3000
taskkill /PID <actual_pid> /F
pnpm --filter @fitrix/web dev
```

### Browser opening Docker `5432`

Cause:

- PostgreSQL port is not HTTP.

Expected:

- Browser cannot render it.

Use:

```powershell
docker exec -it fitrix-pg psql -U postgres -d fitrix
```

## 11) Validation Performed

Multiple checks were run repeatedly during fixes:

- `pnpm --filter @fitrix/web typecheck`
- `pnpm --filter @fitrix/api typecheck`
- DB queries on `User`, `CoachProfile`, invitations, and ownership
- Health checks on API and port listeners

## 12) Current Expected Account/Role Model

Updated for SaaS platform ownership:

- `veilsendu@gmail.com` => `SUPER_ADMIN` only
- `harhsu9souls@gmail.com` => `COACH` only

This keeps global platform ownership separate from future organization/gym admins and coach workspaces.

## 13) Super Admin Foundation

Added the first role-model foundation for selling FitRix to both independent coaches and larger gyms.

Implemented:

- Added `SUPER_ADMIN` to Prisma `UserRole`.
- Added migration: `20260502020000_add_super_admin_role`.
- Regenerated Prisma Client.
- Promoted `veilsendu@gmail.com` to `SUPER_ADMIN`.
- Updated shared `@fitrix/types` role constants.
- Made the global `/admin` API controller require `SUPER_ADMIN`.
- Updated admin layout to allow only `SUPER_ADMIN`.
- Preserved coach behavior for `harhsu9souls@gmail.com`.
- Updated platform override logic in programs, clients, exercises, and users services.
- Added `apps/api/prisma/make-super-admin.ts` for repeatable promotion by email.

Verified:

- API typecheck passed.
- Web typecheck passed.
- Focused exercises service tests passed.
- API restarted successfully at `http://localhost:4000/api/v1`.

Current role split:

- `SUPER_ADMIN`: FitRix platform owner/operator.
- `ADMIN`: future organization/gym owner or manager.
- `COACH`: independent coach or coach under an organization.
- `CLIENT`: end user.

## 14) Organization Ownership Foundation

Added the first real organization layer for SaaS customers such as gyms, larger coaching businesses, and independent teams.

Implemented:

- Added `Organization.ownerId` and owner relation in Prisma.
- Added migration: `20260502033000_add_organization_owner`.
- Added `OrganizationsModule`, `OrganizationsController`, and `OrganizationsService`.
- Added super-admin API actions to list and create organizations.
- Added organization-admin API actions for `/organizations/me` and `/organizations/me/team`.
- Organization admins can manage roles inside their own organization only.
- Organization admins cannot assign `SUPER_ADMIN`.
- Organization owners cannot be demoted away from `ADMIN`.
- New client invitations inherit the inviting coach's organization.
- New programs created by coaches inherit the coach's organization.
- Added `/organization/dashboard` and `/organization/team` pages for organization admins.
- Added `/admin/organizations` for super admins to create customer workspaces and assign owners.
- Updated platform dashboard stats to include total organizations.

Verified:

- Prisma Client regenerated.
- Migration deployed successfully.
- API typecheck passed.
- Web typecheck passed.
- Focused exercises service tests passed.

Current SaaS role split:

- `SUPER_ADMIN`: FitRix platform owner/operator.
- `ADMIN`: owner or manager inside one organization.
- `COACH`: coach inside an organization or independent coach.
- `CLIENT`: end user/client invited by a coach.

## 15) Quick Start (Current)

If Docker DB and API are already running and you only need frontend:

```powershell
cd C:\FinalProject_FitRix\fitrix
pnpm --filter @fitrix/web dev
```

If `3000` is busy:

```powershell
netstat -ano | findstr :3000
taskkill /PID <pid> /F
pnpm --filter @fitrix/web dev
```

---
