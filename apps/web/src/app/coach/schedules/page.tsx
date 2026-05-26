import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";
import { CreateScheduleButton } from "./_components/CreateScheduleButton";

export const dynamic = "force-dynamic";

interface ClientUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface ScheduleRow {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  client: {
    user: ClientUser;
  };
  _count: { days: number };
}

interface ClientOption {
  user: { id: string; email: string; firstName: string | null; lastName: string | null };
}

function fullName(u: ClientUser): string {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function CoachSchedulesPage() {
  let schedules: ScheduleRow[] = [];
  let clients: ClientOption[] = [];
  let error: string | null = null;

  try {
    const [s, c] = await Promise.all([
      apiFetchServer<ScheduleRow[]>("/schedules"),
      apiFetchServer<ClientOption[]>("/clients"),
    ]);
    schedules = s;
    clients = c;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load schedules";
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Calendar</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Schedules
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Place your program sessions on actual calendar dates for each client.
          </p>
        </div>
        {clients.length > 0 ? (
          <CreateScheduleButton
            clients={clients.map((c) => ({
              id: c.user.id,
              name: fullName(c.user),
            }))}
          />
        ) : null}
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <CalendarDays className="h-6 w-6" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-900">
            No schedules yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {clients.length === 0
              ? "Add a client first, then come back to schedule their workouts."
              : "Create a schedule for a client to start placing workouts on the calendar."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {schedules.map((s) => (
            <Link
              key={s.id}
              href={`/coach/schedules/${s.id}`}
              className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-slate-900 group-hover:text-brand-700">
                    {s.name}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {fullName(s.client.user)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-brand-500" />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
                <span>
                  {fmtDate(s.startDate)} →{" "}
                  {s.endDate ? fmtDate(s.endDate) : "ongoing"}
                </span>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
                  {s._count.days} day{s._count.days === 1 ? "" : "s"} placed
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
