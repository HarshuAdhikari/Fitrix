import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Dumbbell } from "lucide-react";
import { apiFetchServer } from "../../../../lib/api-server";
import { LogWorkoutForm } from "./_components/LogWorkoutForm";

export const dynamic = "force-dynamic";

interface SessionExercise {
  id: string;
  orderIndex: number;
  sets: number | null;
  reps: string | null;
  rest: string | null;
  notes: string | null;
  exercise: {
    id: string;
    name: string;
    primaryMuscle: string;
    equipment: string;
    videoUrl: string | null;
    imageUrl: string | null;
    description: string | null;
  };
}

interface SessionResponse {
  id: string;
  weekNumber: number;
  dayNumber: number;
  name: string;
  notes: string | null;
  estimatedDurationMin: number | null;
  program: { id: string; name: string };
  exercises: SessionExercise[];
  lastLog: {
    id: string;
    performedAt: string;
    notes: string | null;
    sets: Array<{
      id: string;
      exerciseId: string;
      setNumber: number;
      reps: number | null;
      weightKg: number | null;
    }>;
  } | null;
}

export default async function ClientSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  let session: SessionResponse | null = null;
  let error: string | null = null;
  try {
    session = await apiFetchServer<SessionResponse>(
      `/client/sessions/${sessionId}`,
    );
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
  if (!session) return null;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/client/program"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to program
        </Link>
      </div>

      <header>
        <p className="text-sm font-medium text-amber-600">
          {session.program.name} · Week {session.weekNumber} · Day{" "}
          {session.dayNumber}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {session.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Dumbbell className="h-3.5 w-3.5" />
            {session.exercises.length} exercises
          </span>
          {session.estimatedDurationMin ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              ~{session.estimatedDurationMin} min
            </span>
          ) : null}
          {session.lastLog ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Last logged{" "}
              {new Date(session.lastLog.performedAt).toLocaleDateString(
                undefined,
                { month: "short", day: "numeric" },
              )}
            </span>
          ) : null}
        </div>
        {session.notes ? (
          <p className="mt-4 max-w-2xl rounded-xl bg-amber-50/60 px-4 py-3 text-sm text-slate-700">
            {session.notes}
          </p>
        ) : null}
      </header>

      {/* Exercises overview */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Today's exercises
        </h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <ul className="divide-y divide-slate-100">
            {session.exercises.map((se, i) => (
              <li key={se.id} className="flex items-start gap-4 px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-sm font-bold text-amber-700">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    {se.exercise.name}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                      {se.exercise.primaryMuscle}
                    </span>
                    <span>{se.exercise.equipment}</span>
                    {se.sets ? (
                      <span className="font-semibold text-slate-700">
                        {se.sets} × {se.reps ?? "—"}
                      </span>
                    ) : null}
                    {se.rest ? <span>Rest {se.rest}</span> : null}
                  </div>
                  {se.notes ? (
                    <p className="mt-2 text-xs text-slate-500">{se.notes}</p>
                  ) : null}
                  {se.exercise.videoUrl ? (
                    <a
                      href={se.exercise.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-medium text-amber-600 hover:text-amber-700"
                    >
                      Watch demo →
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Log form */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Log this workout
        </h2>
        <LogWorkoutForm sessionId={session.id} exercises={session.exercises} />
      </section>
    </div>
  );
}
