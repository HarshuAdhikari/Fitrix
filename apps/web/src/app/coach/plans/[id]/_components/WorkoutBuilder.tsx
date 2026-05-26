"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Check,
  Dumbbell,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { ApiError, createApiClient } from "../../../../../lib/api";

export interface WorkoutExercise {
  id: string; // WorkoutSessionExercise id
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
  };
}

export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type TargetArea = "UPPER_BODY" | "LOWER_BODY" | "CORE" | "FULL_BODY";

export interface Workout {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  estimatedDurationMin: number | null;
  difficulty: Difficulty | null;
  targetAreas: TargetArea[];
  exercises: WorkoutExercise[];
}

interface ExerciseRow {
  id: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
}

// ─── Exercise-create constants (mirror the Exercise Library form) ─────────────

type ExerciseTypeEnum =
  | "STRENGTH"
  | "BODY_WEIGHT"
  | "STRETCHING"
  | "CARDIO"
  | "PLYOMETRIC"
  | "MOBILITY"
  | "BALANCE";

type EquipmentEnum =
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

type TrackingFieldEnum =
  | "REPETITIONS"
  | "TIME"
  | "DISTANCE"
  | "WEIGHT"
  | "RPE"
  | "HEART_RATE";

type TargetAreaEnum = "UPPER_BODY" | "LOWER_BODY" | "CORE" | "FULL_BODY";

type DifficultyEnum = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

interface NewExerciseInput {
  name: string;
  primaryMuscle: string;
  exerciseType: ExerciseTypeEnum;
  equipmentTypes: EquipmentEnum[];
  targetAreas: TargetAreaEnum[];
  trackingFields: TrackingFieldEnum[];
  difficulty: DifficultyEnum;
}

const MUSCLE_OPTIONS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Abs",
  "Obliques",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Adductors",
  "Full Body",
];

const EXERCISE_TYPE_OPTIONS: { value: ExerciseTypeEnum; label: string }[] = [
  { value: "STRENGTH", label: "Strength" },
  { value: "BODY_WEIGHT", label: "Body Weight" },
  { value: "STRETCHING", label: "Stretching" },
  { value: "CARDIO", label: "Cardio" },
  { value: "PLYOMETRIC", label: "Plyometric" },
  { value: "MOBILITY", label: "Mobility" },
  { value: "BALANCE", label: "Balance" },
];

const EQUIPMENT_OPTIONS: { value: EquipmentEnum; label: string }[] = [
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

const EQUIPMENT_LABEL_FOR_LEGACY: Record<EquipmentEnum, string> =
  Object.fromEntries(EQUIPMENT_OPTIONS.map((o) => [o.value, o.label])) as Record<
    EquipmentEnum,
    string
  >;

const TRACKING_FIELD_OPTIONS: { value: TrackingFieldEnum; label: string }[] = [
  { value: "REPETITIONS", label: "Repetitions" },
  { value: "WEIGHT", label: "Weight" },
  { value: "TIME", label: "Time" },
  { value: "DISTANCE", label: "Distance" },
  { value: "RPE", label: "RPE" },
  { value: "HEART_RATE", label: "Heart rate" },
];

const TARGET_AREA_OPTIONS: { value: TargetAreaEnum; label: string }[] = [
  { value: "UPPER_BODY", label: "Upper Body" },
  { value: "LOWER_BODY", label: "Lower Body" },
  { value: "CORE", label: "Core" },
  { value: "FULL_BODY", label: "Full Body" },
];

function togglePick<T extends string>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

interface Props {
  initialWorkout: Workout;
  exerciseLibrary: ExerciseRow[];
}

export function WorkoutBuilder({ initialWorkout, exerciseLibrary }: Props) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [workout, setWorkout] = useState(initialWorkout);
  const [library, setLibrary] = useState<ExerciseRow[]>(exerciseLibrary);

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(initialWorkout.name);
  const [savingName, setSavingName] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveName = async () => {
    if (!name.trim() || name === workout.name) {
      setEditingName(false);
      setName(workout.name);
      return;
    }
    setSavingName(true);
    setError(null);
    try {
      const token = await getToken();
      const updated = await createApiClient(token).patch<Workout>(
        `/workouts/${workout.id}`,
        { name: name.trim() },
      );
      setWorkout(updated);
      setEditingName(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to rename");
    } finally {
      setSavingName(false);
    }
  };

  const addExercise = async (exerciseId: string) => {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      const updated = await createApiClient(token).post<Workout>(
        `/workouts/${workout.id}/exercises`,
        { exerciseId, sets: 3, reps: "10", rest: "60s" },
      );
      setWorkout(updated);
      setPickerOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add exercise");
    } finally {
      setBusy(false);
    }
  };

  const createAndAddExercise = async (input: NewExerciseInput) => {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      const api = createApiClient(token);
      const payload: Record<string, unknown> = {
        name: input.name.trim(),
        primaryMuscle: input.primaryMuscle,
        equipment:
          input.equipmentTypes.length > 0
            ? input.equipmentTypes
                .map((e) => EQUIPMENT_LABEL_FOR_LEGACY[e] ?? e)
                .join(", ")
            : "Bodyweight",
        equipmentTypes: input.equipmentTypes,
        exerciseType: input.exerciseType,
        trackingFields: input.trackingFields,
        targetAreas: input.targetAreas,
        difficulty: input.difficulty,
      };
      const created = await api.post<ExerciseRow>("/exercises", payload);
      setLibrary((prev) => [created, ...prev]);
      const updated = await api.post<Workout>(
        `/workouts/${workout.id}/exercises`,
        { exerciseId: created.id, sets: 3, reps: "10", rest: "60s" },
      );
      setWorkout(updated);
      setPickerOpen(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to create exercise",
      );
    } finally {
      setBusy(false);
    }
  };

  const updateExercise = async (
    linkId: string,
    patch: Partial<Pick<WorkoutExercise, "sets" | "reps" | "rest" | "notes">>,
  ) => {
    setError(null);
    try {
      const token = await getToken();
      const updated = await createApiClient(token).patch<Workout>(
        `/workouts/${workout.id}/exercises/${linkId}`,
        patch,
      );
      setWorkout(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update");
    }
  };

  const removeExercise = async (linkId: string) => {
    if (!confirm("Remove this exercise from the program?")) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      const updated = await createApiClient(token).delete<Workout>(
        `/workouts/${workout.id}/exercises/${linkId}`,
      );
      setWorkout(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove");
    } finally {
      setBusy(false);
    }
  };

  const moveExercise = async (linkId: string, direction: -1 | 1) => {
    const current = workout.exercises.find((e) => e.id === linkId);
    if (!current) return;
    const sorted = [...workout.exercises].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    );
    const idx = sorted.findIndex((e) => e.id === linkId);
    const swap = sorted[idx + direction];
    if (!swap) return;
    // Swap orderIndex values.
    try {
      const token = await getToken();
      const api = createApiClient(token);
      await api.patch<Workout>(
        `/workouts/${workout.id}/exercises/${linkId}`,
        { orderIndex: swap.orderIndex },
      );
      const updated = await api.patch<Workout>(
        `/workouts/${workout.id}/exercises/${swap.id}`,
        { orderIndex: current.orderIndex },
      );
      setWorkout(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reorder");
    }
  };

  const deleteWorkout = async () => {
    if (
      !confirm(
        `Delete program "${workout.name}"? This cannot be undone — schedules using it will lose the assignment.`,
      )
    )
      return;
    setBusy(true);
    try {
      const token = await getToken();
      await createApiClient(token).delete(`/workouts/${workout.id}`);
      router.push("/coach/plans");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void saveName();
                    if (e.key === "Escape") {
                      setEditingName(false);
                      setName(workout.name);
                    }
                  }}
                  className="w-full rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                {savingName ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                ) : null}
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="group flex items-center gap-2 text-left"
              >
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 group-hover:text-brand-700">
                  {workout.name}
                </h1>
                <Pencil className="h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
            <p className="mt-1 text-sm text-slate-500">
              {workout.exercises.length} exercise
              {workout.exercises.length === 1 ? "" : "s"} · click the values
              below to edit sets, reps, and rest.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {workout.difficulty ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  {workout.difficulty === "BEGINNER"
                    ? "Beginner"
                    : workout.difficulty === "INTERMEDIATE"
                      ? "Intermediate"
                      : "Advanced"}
                </span>
              ) : null}
              {workout.estimatedDurationMin ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {workout.estimatedDurationMin} min
                </span>
              ) : null}
              {workout.targetAreas.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700"
                >
                  {a === "UPPER_BODY"
                    ? "Upper Body"
                    : a === "LOWER_BODY"
                      ? "Lower Body"
                      : a === "CORE"
                        ? "Core"
                        : "Full Body"}
                </span>
              ))}
            </div>
            {workout.description ? (
              <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm text-slate-600">
                {workout.description}
              </p>
            ) : null}
          </div>
          <button
            onClick={() => void deleteWorkout()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete program
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
        {workout.exercises.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <Dumbbell className="h-6 w-6" />
            </div>
            <p className="mt-4 text-base font-semibold text-slate-900">
              No exercises yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add your first movement to start building the program.
            </p>
            <button
              onClick={() => setPickerOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Add exercise
            </button>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {workout.exercises
                .slice()
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((we, i, arr) => (
                  <ExerciseRowEditor
                    key={we.id}
                    we={we}
                    isFirst={i === 0}
                    isLast={i === arr.length - 1}
                    onUpdate={(patch) => updateExercise(we.id, patch)}
                    onRemove={() => void removeExercise(we.id)}
                    onMoveUp={() => void moveExercise(we.id, -1)}
                    onMoveDown={() => void moveExercise(we.id, 1)}
                  />
                ))}
            </ul>
            <div className="border-t border-slate-100 p-4">
              <button
                onClick={() => setPickerOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                <Plus className="h-4 w-4" /> Add exercise
              </button>
            </div>
          </>
        )}
      </div>

      {pickerOpen ? (
        <ExercisePicker
          library={library}
          alreadyAdded={new Set(workout.exercises.map((e) => e.exercise.id))}
          onClose={() => setPickerOpen(false)}
          onPick={(id) => void addExercise(id)}
          onCreate={(input) => void createAndAddExercise(input)}
        />
      ) : null}
    </div>
  );
}

function ExerciseRowEditor({
  we,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  we: WorkoutExercise;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (
    patch: Partial<Pick<WorkoutExercise, "sets" | "reps" | "rest" | "notes">>,
  ) => Promise<void> | void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [sets, setSets] = useState<string>(we.sets?.toString() ?? "");
  const [reps, setReps] = useState<string>(we.reps ?? "");
  const [rest, setRest] = useState<string>(we.rest ?? "");

  return (
    <li className="grid grid-cols-12 items-center gap-3 px-4 py-3 hover:bg-slate-50/50">
      <div className="col-span-1 flex flex-col items-center gap-1 text-slate-300">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="rounded p-0.5 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30"
          title="Move up"
        >
          ▲
        </button>
        <span className="text-[10px] font-semibold text-slate-400">
          {we.orderIndex + 1}
        </span>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="rounded p-0.5 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30"
          title="Move down"
        >
          ▼
        </button>
      </div>

      <div className="col-span-4 min-w-0">
        <p className="truncate font-semibold text-slate-900">
          {we.exercise.name}
        </p>
        <p className="truncate text-xs text-slate-500">
          {we.exercise.primaryMuscle} · {we.exercise.equipment}
        </p>
      </div>

      <NumField
        label="Sets"
        className="col-span-2"
        value={sets}
        onChange={setSets}
        onCommit={() =>
          onUpdate({ sets: sets === "" ? null : Number(sets) || null })
        }
      />
      <TextField
        label="Reps"
        className="col-span-2"
        value={reps}
        placeholder="10 / 8-12"
        onChange={setReps}
        onCommit={() => onUpdate({ reps: reps.trim() || null })}
      />
      <TextField
        label="Rest"
        className="col-span-2"
        value={rest}
        placeholder="60s"
        onChange={setRest}
        onCommit={() => onUpdate({ rest: rest.trim() || null })}
      />

      <div className="col-span-1 text-right">
        <button
          onClick={onRemove}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
          title="Remove"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function NumField({
  label,
  className,
  value,
  onChange,
  onCommit,
}: {
  label: string;
  className?: string;
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
}) {
  return (
    <label className={`flex flex-col gap-0.5 ${className ?? ""}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
        }}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </label>
  );
}

function TextField({
  label,
  className,
  value,
  placeholder,
  onChange,
  onCommit,
}: {
  label: string;
  className?: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onCommit: () => void;
}) {
  return (
    <label className={`flex flex-col gap-0.5 ${className ?? ""}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
        }}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </label>
  );
}

function ExercisePicker({
  library: initialLibrary,
  alreadyAdded,
  onClose,
  onPick,
  onCreate,
}: {
  library: ExerciseRow[];
  alreadyAdded: Set<string>;
  onClose: () => void;
  onPick: (id: string) => void;
  onCreate: (input: NewExerciseInput) => void;
}) {
  const { getToken } = useAuth();
  const [library, setLibrary] = useState<ExerciseRow[]>(initialLibrary);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"search" | "create">("search");
  const [q, setQ] = useState("");

  // Always fetch fresh exercises from the API when the picker opens so the
  // library is never dependent on what the server-side render happened to return.
  useEffect(() => {
    let cancelled = false;
    getToken().then((token) => {
      if (!token || cancelled) return;
      createApiClient(token)
        .get<{ data: ExerciseRow[] }>("/exercises?pageSize=500")
        .then((res) => {
          if (!cancelled && Array.isArray(res?.data)) {
            setLibrary(res.data);
          }
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false); });
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return library.filter((e) => {
      if (!needle) return true;
      return (
        e.name.toLowerCase().includes(needle) ||
        e.primaryMuscle.toLowerCase().includes(needle) ||
        e.equipment.toLowerCase().includes(needle)
      );
    });
  }, [library, q]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {mode === "create" ? "New exercise" : "Add exercise"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {mode === "create"
                ? "Create the exercise here — it gets added to your library and dropped straight into the program."
                : "Pick from your library, or use the “New exercise” tab to create one without leaving this screen."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-5">
          <div className="flex gap-2">
            <TabBtn active={mode === "search"} onClick={() => setMode("search")}>
              {loading ? "Library…" : `Library (${library.length})`}
            </TabBtn>
            <TabBtn active={mode === "create"} onClick={() => setMode("create")}>
              + New exercise
            </TabBtn>
          </div>
        </div>

        {mode === "search" ? (
          <>
            <div className="border-b border-slate-100 px-5 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name, muscle, or equipment…"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : library.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-slate-500">
                  Your library is empty. Switch to the{" "}
                  <button
                    onClick={() => setMode("create")}
                    className="font-medium text-brand-600 underline"
                  >
                    + New exercise
                  </button>{" "}
                  tab to add your first one.
                </p>
              ) : filtered.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-slate-500">
                  No exercises match your search.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filtered.map((ex) => {
                    const added = alreadyAdded.has(ex.id);
                    return (
                      <li key={ex.id}>
                        <button
                          disabled={added}
                          onClick={() => onPick(ex.id)}
                          className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              {ex.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {ex.primaryMuscle} · {ex.equipment}
                            </p>
                          </div>
                          {added ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                              <Check className="h-3.5 w-3.5" /> added
                            </span>
                          ) : (
                            <Plus className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        ) : (
          <NewExerciseForm
            initialName={q}
            onCancel={() => setMode("search")}
            onSubmit={(input) => onCreate(input)}
          />
        )}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-brand-600 text-brand-700"
          : "border-transparent text-slate-500 hover:text-slate-700",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function NewExerciseForm({
  initialName,
  onCancel,
  onSubmit,
}: {
  initialName: string;
  onCancel: () => void;
  onSubmit: (input: NewExerciseInput) => void;
}) {
  const [form, setForm] = useState<NewExerciseInput>({
    name: initialName,
    primaryMuscle: "Chest",
    exerciseType: "STRENGTH",
    equipmentTypes: [],
    targetAreas: [],
    trackingFields: ["REPETITIONS"],
    difficulty: "BEGINNER",
  });
  const update = <K extends keyof NewExerciseInput>(
    k: K,
    v: NewExerciseInput[K],
  ) => setForm((p) => ({ ...p, [k]: v }));

  const canSubmit = form.name.trim().length > 0 && form.equipmentTypes.length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ ...form, name: form.name.trim() });
      }}
      className="flex flex-1 flex-col overflow-hidden"
    >
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <Field label="Name" required>
          <input
            autoFocus
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Push-up"
            className={INPUT_CLS_PICKER}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Exercise type" required>
            <select
              value={form.exerciseType}
              onChange={(e) =>
                update("exerciseType", e.target.value as ExerciseTypeEnum)
              }
              className={INPUT_CLS_PICKER}
            >
              {EXERCISE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Difficulty">
            <select
              value={form.difficulty}
              onChange={(e) =>
                update("difficulty", e.target.value as DifficultyEnum)
              }
              className={INPUT_CLS_PICKER}
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </Field>
        </div>

        <Field label="Primary muscle" required>
          <select
            value={form.primaryMuscle}
            onChange={(e) => update("primaryMuscle", e.target.value)}
            className={INPUT_CLS_PICKER}
          >
            {MUSCLE_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Equipment" required>
          <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
            {EQUIPMENT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-xs font-medium text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={form.equipmentTypes.includes(opt.value)}
                  onChange={() =>
                    update(
                      "equipmentTypes",
                      togglePick(form.equipmentTypes, opt.value),
                    )
                  }
                  className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </Field>

        <Field label="Target areas">
          <div className="flex flex-wrap gap-2">
            {TARGET_AREA_OPTIONS.map((opt) => {
              const on = form.targetAreas.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    update(
                      "targetAreas",
                      togglePick(form.targetAreas, opt.value),
                    )
                  }
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    on
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
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
            {TRACKING_FIELD_OPTIONS.map((opt) => {
              const on = form.trackingFields.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    update(
                      "trackingFields",
                      togglePick(form.trackingFields, opt.value),
                    )
                  }
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    on
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> Create & add to program
        </button>
      </div>
    </form>
  );
}

const INPUT_CLS_PICKER =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
