"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ClipboardList, Loader2, CheckCircle2 } from "lucide-react";
import { ApiError, createApiClient } from "../../../../../lib/api";

interface ProgramOption {
  id: string;
  name: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  durationWeeks: number;
}

interface ActiveProgram {
  id: string;
  name: string;
  difficulty: string;
  durationWeeks: number;
  startDate: string | null;
}

export function AssignProgramForm({
  clientUserId,
  clientName,
  programs,
  activeProgram,
}: {
  clientUserId: string;
  clientName: string;
  programs: ProgramOption[];
  activeProgram: ActiveProgram | null;
}) {
  const router = useRouter();
  const { getToken } = useAuth();

  const [selectedId, setSelectedId] = useState<string>(activeProgram?.id ?? "");
  const [startDate, setStartDate] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const token = await getToken();
      const api = createApiClient(token);
      await api.post(`/clients/${clientUserId}/assign-program`, {
        programId: selectedId,
        startDate: startDate || undefined,
      });
      const program = programs.find((p) => p.id === selectedId);
      setSuccess(
        program
          ? `${program.name} assigned to ${clientName}.`
          : "Program assigned.",
      );
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof ApiError ? err.message : "Failed to assign program",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isSame = activeProgram?.id === selectedId && !startDate;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <ClipboardList className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Active programme
          </h2>
          <p className="text-xs text-slate-500">
            {activeProgram
              ? `Currently following ${activeProgram.name} (${activeProgram.durationWeeks} weeks)`
              : "No programme assigned yet."}
          </p>
        </div>
      </div>

      {programs.length === 0 ? (
        <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
          You haven&apos;t created any programmes yet. Build one from{" "}
          <a
            href="/coach/plans"
            className="font-medium text-brand-700 hover:underline"
          >
            Workouts
          </a>{" "}
          first.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Programme
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={submitting}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
            >
              <option value="">Select a programme…</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.durationWeeks} wk ·{" "}
                  {p.difficulty.charAt(0) + p.difficulty.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Start date (optional)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={submitting}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-slate-400">
              Leave blank to start today.
            </p>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!selectedId || submitting || isSame}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assigning…
              </>
            ) : activeProgram ? (
              "Change programme"
            ) : (
              "Assign programme"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
