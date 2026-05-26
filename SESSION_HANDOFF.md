# FitRix — Session Handoff

> Last updated: 2026-05-02
> Repo: `C:\FinalProject_FitRix\fitrix\` (Turborepo monorepo)
> Stack: Next.js 15 (App Router) · NestJS 10 · Prisma 5 · PostgreSQL · Clerk auth · Tailwind

---

## 1. Product context

**FitRix** is a multi-tenant fitness coaching SaaS. The role hierarchy:

| Role | Who | Workspace | Color |
|---|---|---|---|
| `SUPER_ADMIN` | FitRix platform owner | `/admin` | Violet |
| `ADMIN` | Gym / business owner | `/organization` | Emerald |
| `COACH` | Independent or org-employed coach | `/coach` | Blue |
| `CLIENT` | End user | `/client` | Amber |

**Key tenancy rule:** ADMIN sees everything in their `Organization`. COACH sees only their own programs/clients. Independent coaches have `organizationId = null` and stay 100% separate from any gym.

---

## 2. What's been built across this and prior sessions

### 2.1 Auth & post-sign-in routing
- **`/post-auth` router** (`apps/web/src/app/post-auth/page.tsx`) — fetches `/users/me` then redirects by role:
  - `SUPER_ADMIN → /admin/dashboard`
  - `ADMIN → /organization/dashboard`
  - `COACH → /coach/dashboard`
  - `CLIENT → /client/dashboard`
- Sign-in, sign-up, and middleware all use `/post-auth` as the fallback redirect (was previously hard-coded to `/coach/dashboard`, which broke ADMIN/CLIENT users).

### 2.2 SUPER_ADMIN platform layer (`/admin`)
- `/admin/dashboard`, `/admin/organizations`, `/admin/users` already existed.
- Layout has `AccessDenied` gate for non-SUPER_ADMIN visitors.

### 2.3 Organization layer (`/organization`) — for gym owners (ADMIN)
**Backend (`apps/api/src/organizations/`):**
- `GET /organizations/me` — org overview + stats (admins, coaches, clients, programs, pending invitations)
- `GET /organizations/me/team` — all users in the org
- `PATCH /organizations/me/team/:userId/role` — change a member's role
- `GET /organizations/me/programs` — every program in the org with coach + session count + accepted-invitation count
- `GET /organizations/me/clients` — every CLIENT in the org with active coach, derived program (latest ACCEPTED invitation w/ programId), workouts logged, last workout
- `GET /organizations/me/invitations` — invitations sent by coaches in the org (PENDING-but-expired promoted to EXPIRED)
- **`POST /organizations/me/members`** ⭐ — Admin creates an email+password coach/client account via Clerk's backend API (`createClerkClient`). Sets `publicMetadata: { role, organizationId }` so our webhook bootstraps the DB row correctly.
- **`POST /organizations/me/clients/:clientUserId/assign/:coachUserId`** ⭐ — Admin reassigns a client to a different coach (deactivates existing assignment first).

**Frontend (`apps/web/src/app/organization/`):**
- `layout.tsx` — emerald-themed sidebar, gates non-ADMIN with AccessDenied.
- Sidebar nav: **Dashboard · Team · Programs · Clients · Invitations**.
- `dashboard/page.tsx` — metric cards (admins/coaches/clients/programs) + ownership card + pending invitations.
- `team/page.tsx` — list of org members with role-change dropdown + **"Add member" button** that opens `AddMemberModal`.
  - `AddMemberModal.tsx` — form (first/last name, email, temp password, COACH or CLIENT toggle). On success shows credentials with a **Copy credentials** button.
- `programs/page.tsx` — table: Program · Coach · Difficulty · Duration · Sessions · Clients.
- `clients/page.tsx` — table with **inline coach-assignment dropdown** per row.
- `invitations/page.tsx` — table with status badges + counts in header.

### 2.4 Programs tenant scoping (security fix)
**`apps/api/src/programs/programs.service.ts`** — Centralized `assertCanAccessProgram()`:
- `SUPER_ADMIN`: unrestricted.
- `ADMIN`: only programs where `program.organizationId === user.organizationId`.
- `COACH`: only programs where `program.coachId === user.coachProfile.id`. Defense-in-depth: if both have `organizationId` set and they differ, deny.

`findAll()` rewritten with role-aware `where` clauses. `create()` pins `organizationId` to the requester's org (only SUPER_ADMIN may pass an explicit org).

A backfill script (`apps/api/prisma/backfill-program-orgs.ts`) was used to assign legacy programs to LeoGenFitness via Docker Desktop's psql Exec.

### 2.5 CLIENT portal (`/client`)
**Backend (`apps/api/src/client-portal/`):**
- `GET /client/me` — own user + profile + coach + active program + stats
- `GET /client/program` — full active program with sessions + completion status
- `GET /client/sessions/:id` — session detail with last log
- `POST /client/sessions/:id/log` — creates `WorkoutLog` with `WorkoutSet` rows
- `GET /client/history` — recent logs

All gated `@Roles(CLIENT)`. Client's "active program" is derived from the most recent ACCEPTED invitation with a `programId` (avoided a schema change).

**Frontend (`apps/web/src/app/client/`):**
- Amber-themed layout with sidebar (Dashboard / My program / History).
- `dashboard/page.tsx` — greeting, active program card, stat tiles (workouts logged, goals, coach), coach + goals sections.
- `program/page.tsx` — sessions grouped by week with progress bar.
- `program/[sessionId]/page.tsx` — exercises overview + `LogWorkoutForm` (per-set reps/weight inputs).
- `history/page.tsx` — recent workout log feed.

### 2.6 Webhook handler (`apps/api/src/webhooks/webhooks.service.ts`)
`handleUserCreated` now:
1. Reads `role` from `public_metadata` (was already there)
2. **Reads `organizationId` from `public_metadata`** ⭐ (new — for org-managed members)
3. Creates the User row with that org assigned
4. Auto-creates `CoachProfile` for COACH role (was already there)
5. **Auto-creates `ClientProfile` for CLIENT role** ⭐ (new)
6. Falls back to invitation lookup for legacy invitation flow

---

## 3. Two completely separate user tracks

| | Independent coach | Org-managed user |
|---|---|---|
| How created | Self sign-up at `/sign-up` | Admin creates them at `/organization/team` → "Add member" modal |
| Auth | Clerk (they own password) | Clerk (admin sets temp password, shares it) |
| `organizationId` | `null` | Set to admin's org at creation via webhook metadata |
| `role` | `COACH` (default) | `COACH` or `CLIENT` (admin chooses) |
| Profile rows | `CoachProfile` auto-created | `CoachProfile` or `ClientProfile` auto-created |

**This guarantees** that personal-trainer coaches who don't belong to any gym keep working exactly as before, with zero dependency on the gym-owner flow.

---

## 4. Important file map

### API (`apps/api/src/`)
| Concern | File |
|---|---|
| Org mgmt + member creation | `organizations/organizations.service.ts` + `.controller.ts` + `.module.ts` |
| Programs (tenant-scoped) | `programs/programs.service.ts` |
| Client portal | `client-portal/client-portal.service.ts` + `.controller.ts` + `.module.ts` |
| Clerk webhook | `webhooks/webhooks.service.ts` |
| Auth guards / decorators | `auth/decorators/{current-user,roles,public}.decorator.ts` |
| Schema | `prisma/schema.prisma` |

### Web (`apps/web/src/app/`)
| Route | Purpose |
|---|---|
| `/post-auth` | Role-aware redirect after sign-in |
| `/admin/*` | SUPER_ADMIN platform |
| `/organization/*` | ADMIN gym workspace |
| `/coach/*` | COACH personal workspace |
| `/client/*` | CLIENT portal |
| `/sign-in`, `/sign-up`, `/activate` | Clerk-hosted auth flows |

---

## 5. Database — relevant models & relations

```
Organization
  ├─ owner: User (ADMIN)
  ├─ users: User[] (members)
  └─ programs: Program[]

User
  ├─ organizationId? (nullable for independent coaches)
  ├─ role: SUPER_ADMIN | ADMIN | COACH | CLIENT
  ├─ coachProfile? (1:1 — for COACH)
  └─ clientProfile? (1:1 — for CLIENT)

CoachProfile ── coaches: CoachClientAssignment[]
ClientProfile ── coaches: CoachClientAssignment[] (relation field is `coaches`, not `assignments`)
                 ── workoutLogs: WorkoutLog[]

Program
  ├─ coachId (always set — owning coach)
  ├─ organizationId? (set when coach belongs to an org)
  └─ sessions: WorkoutSession[]

Invitation
  ├─ coachId
  ├─ email
  ├─ status: PENDING | ACCEPTED | EXPIRED | CANCELLED
  └─ programId? (links accepted client to "active" program)
```

---

## 6. Environment & infra

- API: `http://localhost:4000`, web: `http://localhost:3000`
- Postgres: Docker container `fitrix-pg` (also `fitrix-db`)
- `apps/api/.env` has: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET`, `DATABASE_URL`
- Common psql access: Docker Desktop → `fitrix-pg` → Exec tab → `psql -U postgres -d fitrix`
- Run dev: `pnpm dev` (turbo) at repo root.
- Typecheck: `pnpm --filter @fitrix/api typecheck` / `pnpm --filter @fitrix/web typecheck`. Both currently green.

---

## 7. The 6-item audit (from earlier conversation)

After auditing the SaaS layers we identified 6 gaps. Status:

| # | Item | Status |
|---|---|---|
| 1 | Programs tenant-scoping security fix | ✅ Done |
| 2 | CLIENT portal (no portal existed) | ✅ Done |
| 3 | Flesh out `/organization` with programs / clients / invitations pages | ✅ Done |
| 3.5 | **Org admins create coach + client accounts (email+password) and assign clients to coaches** ⭐ | ✅ Done (this session) |
| 4 | Real `AuditLog` table + UI | 🔲 Not started |
| 5 | `Plan` + `Entitlement` model (per-org subscription tier, feature flags, seat limits) | 🔲 Not started |
| 6 | SUPER_ADMIN impersonation (sign-in-as-user for support) | 🔲 Not started |

Plus naturally-arising follow-ups:
- 🔲 Coach-side UX for **org coaches** vs **independent coaches** — currently the same `/coach` workspace; eventually org coaches might see a "you're part of LeoGenFitness" badge.
- 🔲 Client portal: real "active program" picker if a client gets multiple programs.
- 🔲 Email delivery (currently invitations send via existing email service; org-member-creation does NOT send a welcome email — admin shares credentials manually via the Copy button).

---

## 8. Where to pick up

**Recommended next:** **#4 (AuditLog)** is the next "boring but important" item — every privileged action (org member creation, role change, program edits, impersonation) should write an audit row. This pairs naturally with #6.

Alternatively, if you want product-visible value: **#5 (Plan + Entitlement)** unlocks billing, and would let SUPER_ADMIN set per-org seat limits (e.g. "LeoGenFitness can have 5 coaches and 50 clients").

**Untested in this session:** the org-managed member creation flow end-to-end. Before adding more features, recommend:
1. Sign in as `harhsu9souls@gmail.com` (ADMIN of LeoGenFitness)
2. Go to `/organization/team` → **Add member**
3. Create a CLIENT with email+password
4. Verify the Clerk webhook fires, the User row appears with `role=CLIENT, organizationId=<LeoGenFitness id>`, and a `ClientProfile` is created
5. Sign in as that new client → confirm `/client/dashboard` works
6. Back as admin, on `/organization/clients`, use the dropdown to assign that client to a coach in the org

---

## 9. Known gotchas / things to remember

- **Prisma relation name:** on `ClientProfile` the assignments relation is `coaches`, not `assignments`. (Bit me once during this session.)
- **`noUncheckedIndexedAccess` is on** in web tsconfig — `array[0]` is `T | undefined`, narrow with `?? fallback` before calling methods.
- **PowerShell quoting** for psql/ts-node is painful. Use Docker Desktop's Exec tab UI instead of trying to escape quotes through the shell.
- **Don't `cd` in Bash tool calls** — working directory is already set; use absolute paths.
- **Webhook is the source of truth** for User row creation. The `POST /organizations/me/members` flow trusts the webhook to fire and bootstrap the DB row. If webhooks are flaky in dev, a `user.created` Clerk event can be replayed from the Clerk dashboard.
- **Clerk dev keys** are in `apps/api/.env` — don't commit any production keys here.

---

## 10. Quick "where am I?" commands

```bash
# Both apps green?
pnpm --filter @fitrix/api typecheck
pnpm --filter @fitrix/web typecheck

# What did we touch?
git status
git log --oneline -20

# DB shell
docker exec -it fitrix-pg psql -U postgres -d fitrix
```
