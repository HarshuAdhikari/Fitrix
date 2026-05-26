import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import {
  Users,
  ClipboardList,
  Dumbbell,
  CalendarClock,
  ArrowRight,
  Plus,
  MessageSquare,
  ListTodo,
  type LucideIcon,
} from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";

export const dynamic = "force-dynamic";

interface DashboardStats {
  activeClients: number;
  programs: number;
  sessionsThisWeek: number;
}

interface ClientRow {
  assignmentId: string;
  status: string;
  startedAt: string;
  clientProfileId: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  goals: string[];
}

interface QueueRow {
  assignmentId: string;
  clientProfileId: string;
  startedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  goals: string[];
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tint: string;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function DashboardPage() {
  const user = await currentUser();
  const firstName = user?.firstName ?? "Coach";

  const stats: DashboardStats = await apiFetchServer<DashboardStats>(
    "/users/me/stats",
  ).catch(() => ({ activeClients: 0, programs: 0, sessionsThisWeek: 0 }));

  const clients: ClientRow[] = await apiFetchServer<ClientRow[]>(
    "/clients",
  ).catch(() => []);

  const exercisesCount = await apiFetchServer<Paginated<unknown>>(
    "/exercises?pageSize=1",
  )
    .then((r) => r.total)
    .catch(() => 0);

  const STATS: StatCard[] = [
    {
      label: "Total clients",
      value: stats.activeClients,
      icon: Users,
      tint: "from-blue-500 to-blue-600",
    },
    {
      label: "Active programs",
      value: stats.programs,
      icon: ClipboardList,
      tint: "from-indigo-500 to-indigo-600",
    },
    {
      label: "Exercises",
      value: exercisesCount,
      icon: Dumbbell,
      tint: "from-sky-500 to-sky-600",
    },
    {
      label: "This week",
      value: stats.sessionsThisWeek,
      icon: CalendarClock,
      tint: "from-cyan-500 to-cyan-600",
    },
  ];

  const plansQueue = await apiFetchServer<QueueRow[]>(
    "/clients/plans-to-assign",
  ).catch(() => []);

  const recentClients = clients.slice(0, 5);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">
            Welcome back, {firstName}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-slate-500">
            Here&apos;s what&apos;s happening in your coaching business today.
          </p>
        </div>
        <Link
          href="/coach/clients"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add client
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.tint} text-white shadow-sm`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-card lg:col-span-2 lg:row-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Recent clients
              </h2>
              <p className="text-xs text-slate-500">
                Your most recently added clients.
              </p>
            </div>
            <Link
              href="/coach/clients"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentClients.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700">
                No clients yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Add your first client to see them here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentClients.map((c) => {
                const name =
                  [c.user.firstName, c.user.lastName]
                    .filter(Boolean)
                    .join(" ") || c.user.email;
                return (
                  <li key={c.assignmentId}>
                    <Link
                      href={`/coach/clients/${c.user.id}`}
                      className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white shadow-sm">
                        {initialsOf(name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {c.user.email}
                        </p>
                      </div>
                      <span className="hidden max-w-[40%] truncate text-xs text-slate-500 sm:inline">
                        {c.goals.length ? c.goals.join(", ") : "No goals set"}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                        {c.status.toLowerCase()}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Plans to assign widget */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <ListTodo className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Plans to assign</h2>
                <p className="text-xs text-slate-500">Active clients with no programme yet</p>
              </div>
            </div>
            {plansQueue.length > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                {plansQueue.length}
              </span>
            )}
          </div>

          {plansQueue.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">All clients are programmed 🎉</p>
              <p className="mt-1 text-xs text-slate-400">New clients will appear here until you assign their first plan.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {plansQueue.slice(0, 5).map((q) => {
                const name = [q.user.firstName, q.user.lastName].filter(Boolean).join(" ") || q.user.email;
                const daysSince = Math.floor((Date.now() - new Date(q.startedAt).getTime()) / 86400000);
                return (
                  <li key={q.assignmentId} className="flex items-center gap-3 px-6 py-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-semibold text-white shadow-sm">
                      {initialsOf(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{name}</p>
                      <p className="text-xs text-slate-400">Active {daysSince === 0 ? "today" : `${daysSince}d ago`}</p>
                    </div>
                    <Link
                      href="/coach/plans"
                      className="shrink-0 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                    >
                      Assign plan
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {plansQueue.length > 5 && (
            <div className="border-t border-slate-100 px-6 py-3 text-center">
              <Link href="/coach/clients" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                View all {plansQueue.length} clients needing plans →
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-base font-semibold text-slate-900">
            Quick actions
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Jump into the most common tasks.
          </p>

          <div className="mt-5 space-y-2">
            <QuickAction
              href="/coach/clients"
              icon={Users}
              title="Manage clients"
              subtitle="Roster, profiles, progress"
            />
            <QuickAction
              href="/coach/plans"
              icon={ClipboardList}
              title="Build a program"
              subtitle="Weekly sessions + exercises"
            />
            <QuickAction
              href="/coach/workouts"
              icon={Dumbbell}
              title="Exercise library"
              subtitle="Your custom movement bank"
            />
            <QuickAction
              href="/coach/clients"
              icon={MessageSquare}
              title="Send check-in"
              subtitle="Coming soon"
              muted
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  subtitle,
  muted = false,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all",
        muted
          ? "opacity-60"
          : "hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover",
      ].join(" ")}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400" />
    </Link>
  );
}
