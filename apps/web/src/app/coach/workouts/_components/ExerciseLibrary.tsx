"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Plus,
  Search,
  Dumbbell,
  X,
  AlertCircle,
  SlidersHorizontal,
  Copy,
  Pencil,
  Trash2,
  Loader2,
  ExternalLink,
  Shield,
  User,
  CheckCircle2,
} from "lucide-react";
import { createApiClient, ApiError } from "../../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExerciseType =
  | "STRENGTH"
  | "BODY_WEIGHT"
  | "STRETCHING"
  | "CARDIO"
  | "PLYOMETRIC"
  | "MOBILITY"
  | "BALANCE";

export type Equipment =
  | "BODYWEIGHT"
  | "DUMBBELL"
  | "BARBELL"
  | "EZ_BAR"
  | "TRAP_BAR"
  | "KETTLEBELL"
  | "MEDICINE_BALL"
  | "SLAM_BALL"
  | "WEIGHT_PLATE"
  | "RESISTANCE_BAND"
  | "CABLE"
  | "MACHINE"
  | "SMITH_MACHINE"
  | "LEG_PRESS"
  | "HACK_SQUAT_MACHINE"
  | "BENCH_FLAT"
  | "BENCH_INCLINE"
  | "BENCH_DECLINE"
  | "BENCH_ADJUSTABLE"
  | "SQUAT_RACK"
  | "POWER_RACK"
  | "PULL_UP_BAR"
  | "DIP_STATION"
  | "SUSPENSION_TRAINER"
  | "AB_WHEEL"
  | "STABILITY_BALL"
  | "BOSU_BALL"
  | "FOAM_ROLLER"
  | "YOGA_MAT"
  | "TREADMILL"
  | "STATIONARY_BIKE"
  | "ROWING_MACHINE"
  | "ELLIPTICAL"
  | "STAIRMASTER"
  | "JUMP_ROPE"
  | "BATTLE_ROPES"
  | "SLED"
  | "SANDBAG"
  | "LANDMINE"
  | "BOX"
  | "PARALLEL_BARS"
  | "OTHER";

export type TrackingField =
  | "REPETITIONS"
  | "TIME"
  | "DISTANCE"
  | "WEIGHT"
  | "RPE"
  | "HEART_RATE";

export type TargetArea = "UPPER_BODY" | "LOWER_BODY" | "CORE" | "FULL_BODY";

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  equipmentTypes: Equipment[];
  exerciseType: ExerciseType | null;
  trackingFields: TrackingField[];
  targetAreas: TargetArea[];
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  description: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  createdById: string | null; // null = system exercise
}

type Difficulty = Exercise["difficulty"];
type DiffFilter = "ALL" | Difficulty;

const EXERCISE_TYPES: { value: ExerciseType; label: string }[] = [
  { value: "STRENGTH", label: "Strength" },
  { value: "BODY_WEIGHT", label: "Body Weight" },
  { value: "STRETCHING", label: "Stretching" },
  { value: "CARDIO", label: "Cardio" },
  { value: "PLYOMETRIC", label: "Plyometric" },
  { value: "MOBILITY", label: "Mobility" },
  { value: "BALANCE", label: "Balance" },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: "BODYWEIGHT", label: "Bodyweight" },
  { value: "DUMBBELL", label: "Dumbbell" },
  { value: "BARBELL", label: "Barbell" },
  { value: "EZ_BAR", label: "EZ Bar" },
  { value: "TRAP_BAR", label: "Trap Bar" },
  { value: "KETTLEBELL", label: "Kettlebell" },
  { value: "MEDICINE_BALL", label: "Medicine Ball" },
  { value: "SLAM_BALL", label: "Slam Ball" },
  { value: "WEIGHT_PLATE", label: "Weight Plate" },
  { value: "RESISTANCE_BAND", label: "Resistance Band" },
  { value: "CABLE", label: "Cable" },
  { value: "MACHINE", label: "Machine (generic)" },
  { value: "SMITH_MACHINE", label: "Smith Machine" },
  { value: "LEG_PRESS", label: "Leg Press" },
  { value: "HACK_SQUAT_MACHINE", label: "Hack Squat Machine" },
  { value: "BENCH_FLAT", label: "Bench — Flat" },
  { value: "BENCH_INCLINE", label: "Bench — Incline" },
  { value: "BENCH_DECLINE", label: "Bench — Decline" },
  { value: "BENCH_ADJUSTABLE", label: "Bench — Adjustable" },
  { value: "SQUAT_RACK", label: "Squat Rack" },
  { value: "POWER_RACK", label: "Power Rack" },
  { value: "PULL_UP_BAR", label: "Pull-Up Bar" },
  { value: "DIP_STATION", label: "Dip Station" },
  { value: "SUSPENSION_TRAINER", label: "Suspension Trainer (TRX)" },
  { value: "AB_WHEEL", label: "Ab Wheel" },
  { value: "STABILITY_BALL", label: "Stability Ball" },
  { value: "BOSU_BALL", label: "Bosu Ball" },
  { value: "FOAM_ROLLER", label: "Foam Roller" },
  { value: "YOGA_MAT", label: "Yoga Mat" },
  { value: "TREADMILL", label: "Treadmill" },
  { value: "STATIONARY_BIKE", label: "Stationary Bike" },
  { value: "ROWING_MACHINE", label: "Rowing Machine" },
  { value: "ELLIPTICAL", label: "Elliptical" },
  { value: "STAIRMASTER", label: "Stairmaster" },
  { value: "JUMP_ROPE", label: "Jump Rope" },
  { value: "BATTLE_ROPES", label: "Battle Ropes" },
  { value: "SLED", label: "Sled" },
  { value: "SANDBAG", label: "Sandbag" },
  { value: "LANDMINE", label: "Landmine" },
  { value: "BOX", label: "Box / Plyo Box" },
  { value: "PARALLEL_BARS", label: "Parallel Bars" },
  { value: "OTHER", label: "Other" },
];

const TRACKING_FIELDS: { value: TrackingField; label: string }[] = [
  { value: "REPETITIONS", label: "Repetitions" },
  { value: "WEIGHT", label: "Weight" },
  { value: "TIME", label: "Time" },
  { value: "DISTANCE", label: "Distance" },
  { value: "RPE", label: "RPE" },
  { value: "HEART_RATE", label: "Heart rate" },
];

const TARGET_AREAS: { value: TargetArea; label: string }[] = [
  { value: "UPPER_BODY", label: "Upper Body" },
  { value: "LOWER_BODY", label: "Lower Body" },
  { value: "CORE", label: "Core" },
  { value: "FULL_BODY", label: "Full Body" },
];

const EQUIPMENT_LABEL: Record<Equipment, string> = Object.fromEntries(
  EQUIPMENT_OPTIONS.map((o) => [o.value, o.label]),
) as Record<Equipment, string>;
const EXERCISE_TYPE_LABEL: Record<ExerciseType, string> = Object.fromEntries(
  EXERCISE_TYPES.map((o) => [o.value, o.label]),
) as Record<ExerciseType, string>;
const TRACKING_FIELD_LABEL: Record<TrackingField, string> = Object.fromEntries(
  TRACKING_FIELDS.map((o) => [o.value, o.label]),
) as Record<TrackingField, string>;
const TARGET_AREA_LABEL: Record<TargetArea, string> = Object.fromEntries(
  TARGET_AREAS.map((o) => [o.value, o.label]),
) as Record<TargetArea, string>;

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFF_STYLE: Record<Difficulty, { pill: string; label: string }> = {
  BEGINNER: { pill: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200", label: "Beginner" },
  INTERMEDIATE: { pill: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200", label: "Intermediate" },
  ADVANCED: { pill: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200", label: "Advanced" },
};

const DIFF_PILLS: { value: DiffFilter; label: string }[] = [
  { value: "ALL", label: "All levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const MUSCLE_GROUPS = [
  "Abs",
  "Adductors",
  "Biceps",
  "Calves",
  "Chest",
  "Core",
  "Forearms",
  "Glutes",
  "Hamstrings",
  "Lats",
  "Lower Back",
  "Obliques",
  "Quads",
  "Shoulders",
  "Traps",
  "Triceps",
  "Upper Back",
] as const;

const INPUT_CLS =
  "h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20";

function getYouTubeThumbnail(url: string) {
  const value = url.trim();
  if (!value) return "";
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ];
  const match = patterns.map((pattern) => value.match(pattern)?.[1]).find(Boolean);
  return match ? `https://img.youtube.com/vi/${match}/hqdefault.jpg` : "";
}

function toggleSelection<T extends string>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  initialExercises: Exercise[];
  initialError: string | null;
}

export function ExerciseLibrary({ initialExercises, initialError }: Props) {
  const { getToken } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [error] = useState<string | null>(initialError);
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("ALL");
  const [difficulty, setDifficulty] = useState<DiffFilter>("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Fetch current user's DB ID to determine exercise ownership
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const me = await createApiClient(token).get<{ id: string }>("/users/me");
        if (!cancelled) setCurrentUserId(me.id);
      } catch { /* non-fatal */ }
    })();
    return () => { cancelled = true; };
  }, [getToken]);

  const muscles = useMemo(() => {
    const set = new Set<string>();
    for (const e of exercises) set.add(e.primaryMuscle);
    return Array.from(set).sort();
  }, [exercises]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((e) => {
      if (muscle !== "ALL" && e.primaryMuscle !== muscle) return false;
      if (difficulty !== "ALL" && e.difficulty !== difficulty) return false;
      if (!q) return true;
      return [e.name, e.primaryMuscle, e.equipment, ...e.secondaryMuscles]
        .join(" ").toLowerCase().includes(q);
    });
  }, [exercises, search, muscle, difficulty]);

  const flashMsg = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 4000);
  };

  const handleCreated = (e: Exercise) => {
    setExercises((prev) => [e, ...prev]);
    setCreateOpen(false);
    flashMsg(`"${e.name}" added to your library`);
  };

  const handleDuplicated = (copy: Exercise) => {
    setExercises((prev) => [copy, ...prev]);
    setSelected(copy); // open the copy's detail so coach can rename it
    flashMsg(`"${copy.name}" added to your library — rename it if you like`);
  };

  const handleUpdated = (updated: Exercise) => {
    setExercises((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setSelected(updated);
    flashMsg(`"${updated.name}" updated`);
  };

  const handleDeleted = (id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
    setSelected(null);
    flashMsg("Exercise deleted");
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Exercise library</h1>
          <p className="mt-1 text-slate-500">
            {exercises.length} movements · your reusable building blocks
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New exercise
        </button>
      </header>

      {/* ── Error ── */}
      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : null}

      {/* ── Success flash ── */}
      {actionMsg ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <p className="text-sm font-medium text-green-800">{actionMsg}</p>
          <button onClick={() => setActionMsg(null)} className="ml-auto text-green-400 hover:text-green-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* ── Filters ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, muscle, or equipment..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={muscle}
              onChange={(e) => setMuscle(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ALL">All muscles</option>
              {muscles.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {DIFF_PILLS.map((p) => {
            const active = difficulty === p.value;
            return (
              <button
                key={p.value}
                onClick={() => setDifficulty(p.value)}
                className={[
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  active ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700",
                ].join(" ")}
              >
                {p.label}
              </button>
            );
          })}
          <span className="ml-auto text-xs text-slate-500">Showing {filtered.length} of {exercises.length}</span>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-slate-400" />
          System exercise — read-only, duplicate to customise
        </div>
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-brand-500" />
          My library — fully editable
        </div>
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Dumbbell className="h-6 w-6" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-900">No exercises match</p>
          <p className="mt-1 text-sm text-slate-500">Try clearing filters or add a new exercise.</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => {
            const diff = DIFF_STYLE[e.difficulty];
            const isSystem = e.createdById === null;
            const isOwned = !isSystem && e.createdById === currentUserId;

            return (
              <button
                key={e.id}
                onClick={() => setSelected(e)}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200">
                      {e.primaryMuscle}
                    </span>
                    {/* System / My Library badge */}
                    {isSystem ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        <Shield className="h-2.5 w-2.5" />
                        System
                      </span>
                    ) : isOwned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                        <User className="h-2.5 w-2.5" />
                        My library
                      </span>
                    ) : null}
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${diff.pill}`}>
                    {diff.label}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-semibold text-slate-900 group-hover:text-brand-700">
                  {e.name}
                </h3>
                <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-slate-500">{e.equipment}</p>

                {e.description ? (
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">{e.description}</p>
                ) : null}

                {e.secondaryMuscles.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {e.secondaryMuscles.map((m) => (
                      <span key={m} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {m}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Bottom hint */}
                <p className="mt-auto pt-4 text-xs text-slate-400 group-hover:text-brand-500">
                  {isSystem ? "Click to view or duplicate →" : "Click to view or edit →"}
                </p>
              </button>
            );
          })}
        </section>
      )}

      {/* ── Create modal ── */}
      {createOpen ? (
        <CreateExerciseModal onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
      ) : null}

      {/* ── Detail / Edit modal ── */}
      {selected ? (
        <ExerciseDetailModal
          exercise={selected}
          currentUserId={currentUserId}
          onClose={() => setSelected(null)}
          onDuplicated={handleDuplicated}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      ) : null}
    </div>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

interface DetailProps {
  exercise: Exercise;
  currentUserId: string | null;
  onClose: () => void;
  onDuplicated: (copy: Exercise) => void;
  onUpdated: (updated: Exercise) => void;
  onDeleted: (id: string) => void;
}

function ExerciseDetailModal({ exercise, currentUserId, onClose, onDuplicated, onUpdated, onDeleted }: DetailProps) {
  const { getToken } = useAuth();
  const [editing, setEditing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSystem = exercise.createdById === null;
  const isOwned = !isSystem && exercise.createdById === currentUserId;

  const handleDuplicate = async () => {
    setDuplicating(true);
    setError(null);
    try {
      const token = await getToken();
      const copy = await createApiClient(token).post<Exercise>(`/exercises/${exercise.id}/duplicate`, {});
      onDuplicated(copy);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to duplicate");
      setDuplicating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${exercise.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      const token = await getToken();
      await createApiClient(token).delete(`/exercises/${exercise.id}`);
      onDeleted(exercise.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <EditExerciseModal
        exercise={exercise}
        onClose={() => setEditing(false)}
        onUpdated={(updated) => { setEditing(false); onUpdated(updated); }}
      />
    );
  }

  const diff = DIFF_STYLE[exercise.difficulty];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`flex items-start justify-between px-6 py-5 ${isSystem ? "bg-slate-50 border-b border-slate-200" : "bg-brand-gradient-soft border-b border-brand-100"}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isSystem ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  <Shield className="h-3 w-3" /> System
                </span>
              ) : isOwned ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                  <User className="h-3 w-3" /> My library
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  Other coach
                </span>
              )}
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${diff.pill}`}>
                {diff.label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 truncate">{exercise.name}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{exercise.equipment}</p>
          </div>
          <button onClick={onClose} className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Type + tracking */}
          <div className="grid grid-cols-2 gap-3">
            {exercise.exerciseType && (
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Exercise type</p>
                <span className="text-sm font-semibold text-slate-800">{EXERCISE_TYPE_LABEL[exercise.exerciseType]}</span>
              </div>
            )}
            {exercise.trackingFields.length > 0 && (
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Tracking fields</p>
                <div className="flex flex-wrap gap-1">
                  {exercise.trackingFields.map((f) => (
                    <span key={f} className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">{TRACKING_FIELD_LABEL[f]}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Muscles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Primary muscle</p>
              <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700">
                {exercise.primaryMuscle}
              </span>
            </div>
            {exercise.secondaryMuscles.length > 0 && (
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Secondary muscles</p>
                <div className="flex flex-wrap gap-1">
                  {exercise.secondaryMuscles.map((m) => (
                    <span key={m} className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {exercise.targetAreas.length > 0 && (
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Target area</p>
              <div className="flex flex-wrap gap-1">
                {exercise.targetAreas.map((a) => (
                  <span key={a} className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">{TARGET_AREA_LABEL[a]}</span>
                ))}
              </div>
            </div>
          )}

          {exercise.equipmentTypes.length > 0 && (
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Equipment</p>
              <div className="flex flex-wrap gap-1">
                {exercise.equipmentTypes.map((e) => (
                  <span key={e} className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">{EQUIPMENT_LABEL[e]}</span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {exercise.description && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Instructions</p>
              <p className="text-sm leading-relaxed text-slate-700">{exercise.description}</p>
            </div>
          )}

          {/* Video / Image */}
          {exercise.videoUrl && (
            <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-brand-600 hover:bg-brand-50">
              <ExternalLink className="h-4 w-4" /> Watch video demo
            </a>
          )}

          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : null}

          {/* System exercise notice */}
          {isSystem && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">Read-only system exercise</p>
              <p className="text-xs text-amber-700">Duplicate it to create an editable copy in your personal library.</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Close
          </button>
          <div className="flex items-center gap-2">
            {isSystem || (!isOwned && !isSystem) ? (
              // System or other coach's exercise — Duplicate only
              <button
                onClick={handleDuplicate}
                disabled={duplicating}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
              >
                {duplicating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                {duplicating ? "Duplicating…" : "Duplicate to my library"}
              </button>
            ) : (
              // Owned exercise — Edit + Delete
              <>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {deleting ? "Deleting…" : "Delete"}
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                >
                  <Pencil className="h-4 w-4" /> Edit
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

interface EditProps {
  exercise: Exercise;
  onClose: () => void;
  onUpdated: (updated: Exercise) => void;
}

function EditExerciseModal({ exercise, onClose, onUpdated }: EditProps) {
  const { getToken } = useAuth();
  const [form, setForm] = useState({
    name: exercise.name,
    primaryMuscle: exercise.primaryMuscle,
    secondaryMuscles: exercise.secondaryMuscles,
    equipment: exercise.equipment,
    equipmentTypes: exercise.equipmentTypes ?? [],
    exerciseType: exercise.exerciseType ?? ("STRENGTH" as ExerciseType),
    trackingFields:
      exercise.trackingFields && exercise.trackingFields.length
        ? exercise.trackingFields
        : (["REPETITIONS"] as TrackingField[]),
    targetAreas: exercise.targetAreas ?? [],
    difficulty: exercise.difficulty,
    description: exercise.description ?? "",
    videoUrl: exercise.videoUrl ?? "",
    imageUrl: exercise.imageUrl ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const thumbnail = getYouTubeThumbnail(form.videoUrl);
      // Keep the legacy free-text `equipment` column in sync with the new
      // canonical `equipmentTypes` array so existing list views still read.
      const equipmentLabel =
        form.equipmentTypes.length > 0
          ? form.equipmentTypes.map((e) => EQUIPMENT_LABEL[e]).join(", ")
          : form.equipment.trim();
      const updated = await createApiClient(token).patch<Exercise>(`/exercises/${exercise.id}`, {
        name: form.name.trim(),
        primaryMuscle: form.primaryMuscle.trim(),
        equipment: equipmentLabel || "Bodyweight",
        equipmentTypes: form.equipmentTypes,
        exerciseType: form.exerciseType,
        trackingFields: form.trackingFields,
        targetAreas: form.targetAreas,
        difficulty: form.difficulty,
        secondaryMuscles: form.secondaryMuscles,
        description: form.description.trim() || null,
        videoUrl: form.videoUrl.trim() || null,
        imageUrl: thumbnail || null,
      });
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update exercise");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Edit exercise</h2>
            <p className="mt-0.5 text-sm text-slate-500">Changes apply only to your library copy.</p>
          </div>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name" required>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="Exercise name" className={INPUT_CLS} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Exercise type" required>
              <select value={form.exerciseType} onChange={(e) => update("exerciseType", e.target.value as ExerciseType)} required className={INPUT_CLS}>
                {EXERCISE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Difficulty">
              <select value={form.difficulty} onChange={(e) => update("difficulty", e.target.value as Difficulty)} className={INPUT_CLS}>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </Field>
          </div>
          <Field label="Primary muscle" required>
            <select value={form.primaryMuscle} onChange={(e) => update("primaryMuscle", e.target.value)} required className={INPUT_CLS}>
              {MUSCLE_GROUPS.map((muscle) => (
                <option key={muscle} value={muscle}>{muscle}</option>
              ))}
            </select>
          </Field>
          <Field label="Equipment" required>
            <div className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
              {EQUIPMENT_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.equipmentTypes.includes(opt.value)}
                    onChange={() => update("equipmentTypes", toggleSelection(form.equipmentTypes, opt.value) as Equipment[])}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Target areas">
            <div className="flex flex-wrap gap-2">
              {TARGET_AREAS.map((opt) => {
                const on = form.targetAreas.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("targetAreas", toggleSelection(form.targetAreas, opt.value) as TargetArea[])}
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-medium",
                      on ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Tracking fields">
            <div className="flex flex-wrap gap-2">
              {TRACKING_FIELDS.map((opt) => {
                const on = form.trackingFields.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("trackingFields", toggleSelection(form.trackingFields, opt.value) as TrackingField[])}
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-medium",
                      on ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Secondary muscles">
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              {MUSCLE_GROUPS.filter((muscle) => muscle !== form.primaryMuscle).map((muscle) => (
                <label key={muscle} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.secondaryMuscles.includes(muscle)}
                    onChange={() => update("secondaryMuscles", toggleSelection(form.secondaryMuscles, muscle))}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  {muscle}
                </label>
              ))}
            </div>
          </Field>
          <Field label="YouTube video URL">
            <input type="url" value={form.videoUrl} onChange={(e) => update("videoUrl", e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className={INPUT_CLS} />
          </Field>
          {getYouTubeThumbnail(form.videoUrl) ? (
            <img src={getYouTubeThumbnail(form.videoUrl)} alt="" className="h-32 w-full rounded-lg object-cover" />
          ) : null}
          <Field label="Description / cues">
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} placeholder="Coaching cues, technique notes..." className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          </Field>

          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Create modal ─────────────────────────────────────────────────────────────

interface CreateProps {
  onClose: () => void;
  onCreated: (e: Exercise) => void;
}

function CreateExerciseModal({ onClose, onCreated }: CreateProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [form, setForm] = useState({
    name: "",
    primaryMuscle: "Quads",
    secondaryMuscles: [] as string[],
    equipmentTypes: [] as Equipment[],
    exerciseType: "STRENGTH" as ExerciseType,
    trackingFields: ["REPETITIONS"] as TrackingField[],
    targetAreas: [] as TargetArea[],
    difficulty: "BEGINNER" as Difficulty,
    description: "",
    videoUrl: "",
    imageUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.equipmentTypes.length === 0) {
      setError("Pick at least one piece of equipment (or Bodyweight).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const thumbnail = getYouTubeThumbnail(form.videoUrl);
      const equipmentLabel = form.equipmentTypes
        .map((e) => EQUIPMENT_LABEL[e])
        .join(", ");
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        primaryMuscle: form.primaryMuscle.trim(),
        equipment: equipmentLabel,
        equipmentTypes: form.equipmentTypes,
        exerciseType: form.exerciseType,
        trackingFields: form.trackingFields,
        targetAreas: form.targetAreas,
        difficulty: form.difficulty,
      };
      if (form.secondaryMuscles.length) payload.secondaryMuscles = form.secondaryMuscles;
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.videoUrl.trim()) payload.videoUrl = form.videoUrl.trim();
      if (thumbnail) payload.imageUrl = thumbnail;
      const created = await createApiClient(token).post<Exercise>("/exercises", payload);
      onCreated(created);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create exercise");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">New exercise</h2>
            <p className="mt-0.5 text-sm text-slate-500">Add a movement to your library.</p>
          </div>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name" required>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} required autoFocus placeholder="e.g. Goblet Squat" className={INPUT_CLS} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Exercise type" required>
              <select value={form.exerciseType} onChange={(e) => update("exerciseType", e.target.value as ExerciseType)} required className={INPUT_CLS}>
                {EXERCISE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Difficulty">
              <select value={form.difficulty} onChange={(e) => update("difficulty", e.target.value as Difficulty)} className={INPUT_CLS}>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </Field>
          </div>
          <Field label="Primary muscle" required>
            <select value={form.primaryMuscle} onChange={(e) => update("primaryMuscle", e.target.value)} required className={INPUT_CLS}>
              {MUSCLE_GROUPS.map((muscle) => (
                <option key={muscle} value={muscle}>{muscle}</option>
              ))}
            </select>
          </Field>
          <Field label="Equipment" required>
            <div className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
              {EQUIPMENT_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.equipmentTypes.includes(opt.value)}
                    onChange={() => update("equipmentTypes", toggleSelection(form.equipmentTypes, opt.value))}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Target areas">
            <div className="flex flex-wrap gap-2">
              {TARGET_AREAS.map((opt) => {
                const on = form.targetAreas.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("targetAreas", toggleSelection(form.targetAreas, opt.value))}
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-medium",
                      on ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Tracking fields">
            <div className="flex flex-wrap gap-2">
              {TRACKING_FIELDS.map((opt) => {
                const on = form.trackingFields.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("trackingFields", toggleSelection(form.trackingFields, opt.value))}
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-medium",
                      on ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Secondary muscles">
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              {MUSCLE_GROUPS.filter((muscle) => muscle !== form.primaryMuscle).map((muscle) => (
                <label key={muscle} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.secondaryMuscles.includes(muscle)}
                    onChange={() => update("secondaryMuscles", toggleSelection(form.secondaryMuscles, muscle))}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  {muscle}
                </label>
              ))}
            </div>
          </Field>
          <Field label="YouTube video URL">
            <input type="url" value={form.videoUrl} onChange={(e) => update("videoUrl", e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className={INPUT_CLS} />
          </Field>
          {getYouTubeThumbnail(form.videoUrl) ? (
            <img src={getYouTubeThumbnail(form.videoUrl)} alt="" className="h-32 w-full rounded-lg object-cover" />
          ) : null}
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} placeholder="Cues, technique notes..." className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          </Field>
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60">
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}{required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
