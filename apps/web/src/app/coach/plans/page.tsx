import { apiFetchServer } from "../../../lib/api-server";
import { CreateWorkoutButton } from "./_components/CreateWorkoutButton";
import { ProgramsClientView, type WorkoutRow } from "./_components/ProgramsClientView";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  let workouts: WorkoutRow[] = [];
  let error: string | null = null;

  try {
    workouts = await apiFetchServer<WorkoutRow[]>("/workouts");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load programs";
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-600">Coach portal</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Workouts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Build a workout by adding exercises and setting sets, reps, and
            rest. Use the schedule to place workouts on a client&apos;s calendar,
            or group workouts into a Program from the organization workspace.
          </p>
        </div>
        <CreateWorkoutButton />
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <ProgramsClientView workouts={workouts} />
      )}
    </div>
  );
}
