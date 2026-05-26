import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { ApiError } from "../../../../lib/api";
import { apiFetchServer } from "../../../../lib/api-server";
import { WorkoutBuilder, type Workout } from "./_components/WorkoutBuilder";

export const dynamic = "force-dynamic";

interface ExerciseRow {
  id: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
}

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let workout: Workout | null = null;
  let allExercises: ExerciseRow[] = [];
  let error: string | null = null;

  try {
    workout = await apiFetchServer<Workout>(`/workouts/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    error = e instanceof Error ? e.message : "Failed to load program";
  }

  try {
    const result = await apiFetchServer<{ data: ExerciseRow[] }>(
      "/exercises?pageSize=500",
    );
    allExercises = result.data;
  } catch {
    /* picker still opens, just empty */
  }

  if (!workout) {
    return (
      <div className="space-y-4">
        <Link
          href="/coach/plans"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to programs
        </Link>
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error ?? "Not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/coach/plans"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to programs
      </Link>
      <WorkoutBuilder initialWorkout={workout} exerciseLibrary={allExercises} />
    </div>
  );
}
