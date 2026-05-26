import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { Shield, ShieldAlert, ArrowRight } from "lucide-react";
import { apiFetchServer } from "../../lib/api-server";
import { AdminSidebarNav } from "./_components/AdminSidebarNav";

interface MeResponse {
  id: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hard role-gate: anyone not signed in goes to sign-in. Non-admins see a
  // clear "access denied" page rather than getting silently bounced to /coach.
  let me: MeResponse | null = null;
  try {
    me = await apiFetchServer<MeResponse>("/users/me");
  } catch {
    redirect("/sign-in");
  }

  if (me?.role !== "SUPER_ADMIN") {
    return <AccessDenied currentRole={me?.role ?? "UNKNOWN"} email={me?.email ?? ""} />;
  }

  const clerkUser = await currentUser();
  const displayName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    "Super admin";
  const initials =
    [clerkUser?.firstName?.[0], clerkUser?.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "A";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-800/50 bg-[#0F172A] text-slate-100">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 pt-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white shadow-md shadow-violet-600/30">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <p className="text-base font-semibold leading-tight text-white">
              FitRix
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-violet-400">
              Admin console
            </p>
          </div>
        </div>

        <AdminSidebarNav />

        {/* Profile footer */}
        <div className="mt-auto border-t border-slate-800/60 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {displayName}
              </p>
              <p className="truncate text-xs text-violet-400">Super administrator</p>
            </div>
            <UserButton
              appearance={{ elements: { avatarBox: "h-8 w-8" } }}
            />
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-8 py-10">{children}</div>
      </main>
    </div>
  );
}

function AccessDenied({
  currentRole,
  email,
}: {
  currentRole: string;
  email: string;
}) {
  const isCoach = currentRole === "COACH";
  const isAdmin = currentRole === "ADMIN";
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
          Access denied
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          The platform console is restricted to super administrators. Your
          account does not have the required platform role.
        </p>

        <dl className="mt-6 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          {email ? (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Signed in as</dt>
              <dd className="truncate font-medium text-slate-900">{email}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Current role</dt>
            <dd className="font-mono text-xs font-semibold text-slate-900">
              {currentRole}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-3">
          {isCoach ? (
            <Link
              href="/coach/dashboard"
              className="inline-flex items-center justify-between rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              Go to coach dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
          {isAdmin ? (
            <Link
              href="/coach/dashboard"
              className="inline-flex items-center justify-between rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              Go to workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5">
            <span className="text-sm text-slate-600">
              Switch account to continue
            </span>
            <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          If you believe this is a mistake, contact a platform owner to request
          the SUPER_ADMIN role.
        </p>
      </div>
    </div>
  );
}
