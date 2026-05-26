"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createApiClient, ApiError } from "../../../../../lib/api";

interface SessionExercise {
  id: string;
  sets: number | null;
  reps: string | null;
  exercise: { id: string; name: string };
}

interface SetRow {
  exerciseId: string;
  setNumber: number;
  reps: string;
  weightKg: string;
}

export function LogWorkoutForm({
  sessionId,
  exercises,
}: {
  sessionId: string;
  exercises: SessionExercise[];
}) {
  const router = useRouter();
  const { getToken } = useAuth();

  // Pre-build empty set rows: one row per planned set per exercise.
  const initialRows = useMemo<SetRow[]>(() => {
    const rows: SetRow[] = [];
    for (const se of exercises) {
      const setCount = se.sets ?? 1;
      for (let i = 1; i <= setCount; i++) {
        rows.push({
          exerciseId: se.exercise.id,
          setNumber: i,
          reps: "",
          weightKg: "",
        });
      }
    }
    return rows;
  }, [exercises]);

  const [rows, setRows] = useState<SetRow[]>(initialRows);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRow = (idx: number, patch: Partial<SetRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const api = createApiClient(token);
      const sets = rows
        .filter((r) => r.reps !== "" || r.weightKg !== "")
        .map((r) => ({
          exerciseId: r.exerciseId,
          setNumber: r.setNumber,
          reps: r.reps === "" ? undefined : Number(r.reps),
          weightKg: r.weightKg === "" ? undefined : Number(r.weightKg),
        }));
      await api.post(`/client/sessions/${sessionId}/log`, {
        notes: notes.trim() || undefined,
        sets,
      });
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save log");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="mt-3 text-base font-semibold text-emerald-800">
          Workout logged. Great job!
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setRows(initialRows);
            setNotes("");
          }}
          className="mt-4 text-sm font-medium text-emerald-700 underline"
        >
          Log another set
        </button>
      </div>
    );
  }

  // Group rows back by exercise for display
  const grouped = new Map<string, { name: string; rows: { row: SetRow; idx: number }[] }>();
  rows.forEach((row, idx) => {
    const ex = exercises.find((e) => e.exercise.id === row.exerciseId);
    if (!ex) return;
    const g = grouped.get(row.exerciseId) ?? { name: ex.exercise.name, rows: [] };
    g.rows.push({ row, idx });
    grouped.set(row.exerciseId, g);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {Array.from(grouped.entries()).map(([exId, group]) => (
        <div
          key={exId}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
        >
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
            <p className="font-semibold text-slate-900">{group.name}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-2">Set</th>
                <th className="px-5 py-2">Reps</th>
                <th className="px-5 py-2">Weight (kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {group.rows.map(({ row, idx }) => (
                <tr key={idx}>
                  <td className="px-5 py-2.5 font-mono text-xs font-semibold text-slate-700">
                    {row.setNumber}
                  </td>
                  <td className="px-5 py-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={row.reps}
                      onChange={(e) => updateRow(idx, { reps: e.target.value })}
                      placeholder="—"
                      className="w-24 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                  </td>
                  <td className="px-5 py-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.5"
                      value={row.weightKg}
                      onChange={(e) =>
                        updateRow(idx, { weightKg: e.target.value })
                      }
                      placeholder="—"
                      className="w-24 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="How did it feel? Any pain? Energy levels?"
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-base font-semibold text-white shadow-md shadow-amber-500/20 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Mark workout complete
          </>
        )}
      </button>
    </form>
  );
}
