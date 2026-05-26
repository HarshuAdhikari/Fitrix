import Link from "next/link";
import { Activity, ChevronRight, Dumbbell } from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";

export const dynamic = "force-dynamic";

interface HistoryRow {
  id: string;
  performedAt: string;
  notes: string | null;
  setCount: number;
  session: {
    id: string;
    name: string;
    weekNumber: number;
    dayNumber: number;
    program: { id: string; name: string };
  };
}

export default async function ClientHistoryPage() {
  let logs: HistoryRow[] = [];
  let error: string | null = null;
  try {
    logs = await apiFetchServer<HistoryRow[]>("/client/history");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load";
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-amber-600">History</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Workout history
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Your most recent logged sessions. Showing the last {logs.length || 0}.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {logs.length === 0 && !error ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-card">
          <Activity className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 font-semibold text-slate-900">No workouts logged yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Open a session in your program and tap "Mark workout complete" to
            start tracking.
          </p>
          <Link
            href="/client/program"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Open my program
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <ul className="divide-y divide-slate-100">
            {logs.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/client/program/${l.session.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-amber-50/40"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Dumbbell className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {l.session.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {l.session.program.name} · Week {l.session.weekNumber} ·
                      Day {l.session.dayNumber} · {l.setCount} sets
                    </p>
                    {l.notes ? (
                      <p className="mt-1 line-clamp-1 text-xs italic text-slate-500">
                        "{l.notes}"
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-700">
                      {new Date(l.performedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(l.performedAt).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
