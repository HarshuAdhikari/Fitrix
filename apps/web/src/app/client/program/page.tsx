import Link from "next/link";
import { Calendar, CheckCircle2, ChevronRight, Clock } from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";

export const dynamic = "force-dynamic";

interface SessionRow {
  id: string;
  weekNumber: number;
  dayNumber: number;
  name: string;
  notes: string | null;
  estimatedDurationMin: number | null;
  exerciseCount: number;
  lastLoggedAt: string | null;
  completed: boolean;
}

interface ProgramResponse {
  id: string;
  name: string;
  description: string | null;
  durationWeeks: number;
  difficulty: string;
  startDate: string | null;
  sessions: SessionRow[];
}

export default async function ClientProgramPage() {
  let program: ProgramResponse | null = null;
  let error: string | null = null;
  try {
    program = await apiFetchServer<ProgramResponse | null>("/client/program");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load";
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!program) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-card">
        <Calendar className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          No program assigned yet
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Your coach hasn't given you a plan. We'll show it here as soon as
          they do.
        </p>
      </div>
    );
  }

  // Group sessions by week.
  const byWeek = new Map<number, SessionRow[]>();
  for (const s of program.sessions) {
    const list = byWeek.get(s.weekNumber) ?? [];
    list.push(s);
    byWeek.set(s.weekNumber, list);
  }
  const weeks = Array.from(byWeek.keys()).sort((a, b) => a - b);

  const totalSessions = program.sessions.length;
  const completedSessions = program.sessions.filter((s) => s.completed).length;
  const progressPct =
    totalSessions === 0 ? 0 : Math.round((completedSessions / totalSessions) * 100);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-amber-600">My program</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {program.name}
        </h1>
        {program.description ? (
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            {program.description}
          </p>
        ) : null}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              Progress
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {completedSessions} / {totalSessions} sessions
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">{progressPct}% complete</p>
        </div>
      </header>

      {weeks.map((weekNum) => {
        const sessions = (byWeek.get(weekNum) ?? []).sort(
          (a, b) => a.dayNumber - b.dayNumber,
        );
        return (
          <section key={weekNum} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Week {weekNum}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
              <ul className="divide-y divide-slate-100">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/client/program/${s.id}`}
                      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-amber-50/40"
                    >
                      <div
                        className={[
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                          s.completed
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600",
                        ].join(" ")}
                      >
                        {s.completed ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          `D${s.dayNumber}`
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                          {s.name}
                        </p>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                          <span>{s.exerciseCount} exercises</span>
                          {s.estimatedDurationMin ? (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {s.estimatedDurationMin} min
                            </span>
                          ) : null}
                          {s.lastLoggedAt ? (
                            <span className="text-emerald-600">
                              Logged{" "}
                              {new Date(s.lastLoggedAt).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
}
