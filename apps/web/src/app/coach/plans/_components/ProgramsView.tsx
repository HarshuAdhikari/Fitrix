"use client";

import { useState, useMemo, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Plus,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  Layers3,
  TrendingUp,
  ArrowRight,
  X,
  AlertCircle,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { createApiClient, ApiError } from "../../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Program {
  id: string;
  name: string;
  description: string | null;
  durationWeeks: number;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  createdAt: string;
  _count?: { sessions: number };
}

type Difficulty = Program["difficulty"];

// ─── Style maps ───────────────────────────────────────────────────────────────

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  BEGINNER: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  INTERMEDIATE: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200",
  ADVANCED: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
};

const DIFFICULTY_TINTS: Record<Difficulty, string> = {
  BEGINNER: "from-emerald-400/30 to-emerald-500/10",
  INTERMEDIATE: "from-blue-400/30 to-blue-500/10",
  ADVANCED: "from-amber-300/30 to-orange-400/10",
};

function diffLabel(d: Difficulty) {
  return d.charAt(0) + d.slice(1).toLowerCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  initialPrograms: Program[];
  initialError: string | null;
}

export function ProgramsView({ initialPrograms, initialError }: Props) {
  const router = useRouter();
  const { getToken } = useAuth();

  const [programs, setPrograms] = useState<Program[]>(initialPrograms);
  const [pageError] = useState<string | null>(initialError);
  const [modalOpen, setModalOpen] = useState(false);

  const totalSessions = useMemo(
    () => programs.reduce((s, p) => s + (p._count?.sessions ?? 0), 0),
    [programs],
  );
  const avgDuration = useMemo(
    () =>
      programs.length
        ? Math.round(programs.reduce((s, p) => s + p.durationWeeks, 0) / programs.length)
        : 0,
    [programs],
  );

  const handleCreated = (p: Program) => {
    setPrograms((prev) => [p, ...prev]);
    setModalOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Program builder</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Training plans</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Build reusable multi-week programs, review weekly structure, and keep every session ready for assignment.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition-colors hover:bg-brand-700 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          New program
        </button>
      </header>

      {/* ── Summary cards ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard icon={ClipboardList} label="Programs" value={String(programs.length)} />
        <SummaryCard icon={TrendingUp} label="Total sessions" value={String(totalSessions)} />
        <SummaryCard
          icon={CalendarDays}
          label="Avg. duration"
          value={programs.length ? `${avgDuration} weeks` : "0 weeks"}
        />
      </section>

      {/* ── Error ── */}
      {pageError ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{pageError}</p>
        </div>
      ) : null}

      {/* ── Empty state ── */}
      {programs.length === 0 && !pageError ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient-soft text-brand-700">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">No programs yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Create your first program to start assigning workouts to clients.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Create program
          </button>
        </div>
      ) : (
        /* ── Program grid ── */
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((program) => {
            const sessionCount = program._count?.sessions ?? 0;
            return (
              <Link
                key={program.id}
                href={`/coach/plans/${program.id}`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover"
              >
                <div className="relative h-28 bg-brand-gradient">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.3),_transparent_45%)]" />
                  <div className="absolute bottom-4 left-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25">
                      <Dumbbell className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className={[
                    "absolute right-4 top-4 inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm",
                    program.difficulty === "BEGINNER" ? "text-emerald-700"
                      : program.difficulty === "ADVANCED" ? "text-amber-700"
                      : "text-brand-700",
                  ].join(" ")}>
                    {diffLabel(program.difficulty)}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-slate-900 transition-colors group-hover:text-brand-700">
                        {program.name}
                      </h3>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        {program.durationWeeks} week framework
                      </p>
                    </div>
                    <div className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${DIFFICULTY_TINTS[program.difficulty]} ring-1 ring-white/10 sm:flex`}>
                      <Layers3 className="h-4 w-4 text-slate-600" />
                    </div>
                  </div>

                  {program.description ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{program.description}</p>
                  ) : (
                    <p className="mt-3 text-sm italic text-slate-400">No description provided yet.</p>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Duration</p>
                      <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
                        <CalendarDays className="h-3.5 w-3.5 text-brand-600" />
                        {program.durationWeeks} weeks
                      </span>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Sessions</p>
                      <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
                        <TrendingUp className="h-3.5 w-3.5 text-brand-600" />
                        {sessionCount} total
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <span className={["inline-flex items-center rounded-full px-2.5 py-1 font-medium", DIFFICULTY_STYLES[program.difficulty]].join(" ")}>
                      {diffLabel(program.difficulty)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                      <Layers3 className="h-3 w-3" />
                      {sessionCount > 1 ? "Multi-session" : "Single session"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(program.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-6">
                    <span className="text-xs text-slate-400">Open weekly breakdown</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-1.5 group-hover:text-brand-700">
                      Open
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {modalOpen ? (
        <CreateProgramModal
          onClose={() => setModalOpen(false)}
          onCreated={handleCreated}
        />
      ) : null}
    </div>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient-soft text-brand-700">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

// ─── Create Program Modal ─────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreated: (p: Program) => void;
}

function CreateProgramModal({ onClose, onCreated }: CreateModalProps) {
  const { getToken } = useAuth();

  const [form, setForm] = useState({
    name: "",
    description: "",
    durationWeeks: 4,
    difficulty: "BEGINNER" as Difficulty,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const created = await createApiClient(token).post<Program>("/programs", {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        durationWeeks: form.durationWeeks,
        difficulty: form.difficulty,
      });
      onCreated(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create program");
      setSubmitting(false);
    }
  };

  const inputCls =
    "h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20";

  const DIFFICULTIES: Difficulty[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
  const DIFF_COLOR: Record<Difficulty, string> = {
    BEGINNER: "border-emerald-400 bg-emerald-50 text-emerald-700",
    INTERMEDIATE: "border-brand-400 bg-brand-50 text-brand-700",
    ADVANCED: "border-amber-400 bg-amber-50 text-amber-700",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">New program</h2>
            <p className="mt-1 text-sm text-slate-500">
              Create a reusable training plan you can assign to any client.
            </p>
          </div>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Program name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              autoFocus
              required
              placeholder="e.g. 12-Week Strength Foundation"
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="Brief overview of the program goals and structure..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Duration + Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Duration (weeks)</label>
              <input
                type="number"
                value={form.durationWeeks}
                onChange={(e) => update("durationWeeks", Math.max(1, Number(e.target.value)))}
                min={1}
                max={52}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => update("difficulty", e.target.value as Difficulty)}
                className={inputCls}
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
          </div>

          {/* Difficulty visual picker */}
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => update("difficulty", d)}
                className={[
                  "flex-1 rounded-xl border-2 py-2.5 text-xs font-semibold transition-all",
                  form.difficulty === d
                    ? DIFF_COLOR[d]
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                ].join(" ")}
              >
                {diffLabel(d)}
              </button>
            ))}
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.name.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</> : <><Plus className="h-4 w-4" />Create program</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
