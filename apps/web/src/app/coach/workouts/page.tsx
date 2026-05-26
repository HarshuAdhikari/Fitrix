import { apiFetchServer } from "../../../lib/api-server";
import {
  ExerciseLibrary,
  type Exercise,
} from "./_components/ExerciseLibrary";

export const dynamic = "force-dynamic";

interface PaginatedExercises {
  data: Exercise[];
  total: number;
  page: number;
  pageSize: number;
}

export default async function WorkoutsPage() {
  let exercises: Exercise[] = [];
  let error: string | null = null;

  try {
    const result = await apiFetchServer<PaginatedExercises>(
      "/exercises?pageSize=100",
    );
    exercises = result.data;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load exercises";
  }

  return <ExerciseLibrary initialExercises={exercises} initialError={error} />;
}
