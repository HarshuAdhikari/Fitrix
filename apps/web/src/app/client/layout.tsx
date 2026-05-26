import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { ArrowRight, Flame, ShieldAlert } from "lucide-react";
import { apiFetchServer } from "../../lib/api-server";
import { ClientSidebarNav } from "./_components/ClientSidebarNav";

interface MeResponse {
  id: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let me: MeResponse | null = null;
  try {
    me = await apiFetchServer<MeResponse>("/users/me");
  } catch {
    redirect("/sign-in");
  }

  if (me?.role !== "CLIENT") {
    return (
      <AccessDenied
        currentRole={me?.role ?? "UNKNOWN"}
        email={me?.email ?? ""}
      />
    );
  }

  const clerkUser = await currentUser();
  const displayName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    "Athlete";
  const initials =
    [clerkUser?.firstName?.[0], clerkUser?.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "C";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-800/50 bg-[#0F172A] text-slate-100">
        <div className="flex items-center gap-2.5 px-6 pt-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-sm font-bold text-white shadow-md shadow-amber-500/30">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <p className="text-base font-semibold leading-tight text-white">
              FitRix
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-amber-400">
              Athlete portal
            </p>
          </div>
        </div>

        <ClientSidebarNav />

        <div className="mt-auto border-t border-slate-800/60 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {displayName}
              </p>
              <p className="truncate text-xs text-amber-400">Athlete</p>
            </div>
            <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-5xl px-8 py-10">{children}</div>
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
  const dest =
    currentRole === "SUPER_ADMIN"
      ? "/admin/dashboard"
      : currentRole === "ADMIN"
        ? "/organization/dashboard"
        : "/coach/dashboard";
  const destLabel =
    currentRole === "SUPER_ADMIN"
      ? "Go to platform admin"
      : currentRole === "ADMIN"
        ? "Go to organization"
        : "Go to coach dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
          Athlete portal
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          This area is for clients of a FitRix coach. Your account has a
          different role.
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
          <Link
            href={dest}
            className="inline-flex items-center justify-between rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
          >
            {destLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5">
            <span className="text-sm text-slate-600">
              Switch account to continue
            </span>
            <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
          </div>
        </div>
      </div>
    </div>
  );
}
