"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList, Dumbbell, Search, X } from "lucide-react";

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type TargetArea = "UPPER_BODY" | "LOWER_BODY" | "CORE" | "FULL_BODY";

const TARGET_AREA_LABEL: Record<TargetArea, string> = {
  UPPER_BODY: "Upper Body",
  LOWER_BODY: "Lower Body",
  CORE: "Core",
  FULL_BODY: "Full Body",
};

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  BEGINNER: "bg-emerald-50 text-emerald-700",
  INTERMEDIATE: "bg-amber-50 text-amber-700",
  ADVANCED: "bg-red-50 text-red-700",
};

export interface WorkoutRow {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  estimatedDurationMin: number | null;
  difficulty: Difficulty | null;
  targetAreas: TargetArea[];
  exerciseCount: number;
}

export function ProgramsClientView({ workouts }: { workouts: WorkoutRow[] }) {
  const [query, setQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "ALL">("ALL");
  const [areaFilter, setAreaFilter] = useState<TargetArea | "ALL">("ALL");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return workouts.filter((w) => {
      if (needle && !w.name.toLowerCase().includes(needle)) return false;
      if (difficultyFilter !== "ALL" && w.difficulty !== difficultyFilter) return false;
      if (areaFilter !== "ALL" && !w.targetAreas.includes(areaFilter)) return false;
      return true;
    });
  }, [workouts, query, difficultyFilter, areaFilter]);

  const hasFilters = query !== "" || difficultyFilter !== "ALL" || areaFilter !== "ALL";

  function clearFilters() {
    setQuery("");
    setDifficultyFilter("ALL");
    setAreaFilter("ALL");
  }

  if (workouts.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <ClipboardList className="h-6 w-6" />
        </div>
        <p className="mt-4 text-base font-semibold text-slate-900">No workouts yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Create your first workout to start building a library you can schedule for clients.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search workouts…"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as Difficulty | "ALL")}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        >
          <option value="ALL">All difficulties</option>
          {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => (
            <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>
          ))}
        </select>
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value as TargetArea | "ALL")}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        >
          <option value="ALL">All target areas</option>
          {(Object.keys(TARGET_AREA_LABEL) as TargetArea[]).map((a) => (
            <option key={a} value={a}>{TARGET_AREA_LABEL[a]}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm text-slate-500 hover:bg-slate-50"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Results count */}
      {hasFilters && (
        <p className="text-sm text-slate-500">
          {filtered.length} of {workouts.length} workouts
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-card">
          <p className="text-sm font-medium text-slate-700">No workouts match your filters.</p>
          <button onClick={clearFilters} className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((w) => (
            <Link
              key={w.id}
              href={`/coach/plans/${w.id}`}
              className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-slate-900 group-hover:text-brand-700">
                    {w.name}
                  </h2>
                  {w.description ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{w.description}</p>
                  ) : null}
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-brand-500" />
              </div>
              {w.targetAreas.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1">
                  {w.targetAreas.map((a) => (
                    <span key={a} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {TARGET_AREA_LABEL[a]}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
                    <Dumbbell className="h-3 w-3" />
                    {w.exerciseCount} exercise{w.exerciseCount === 1 ? "" : "s"}
                  </span>
                  {w.difficulty ? (
                    <span className={`rounded-full px-2 py-0.5 font-medium ${DIFFICULTY_COLOR[w.difficulty]}`}>
                      {DIFFICULTY_LABEL[w.difficulty]}
                    </span>
                  ) : null}
                </div>
                {w.estimatedDurationMin ? (
                  <span className="text-slate-500">{w.estimatedDurationMin} min</span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
