import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { apiFetchServer } from "../../../../lib/api-server";
import { ScheduleCalendar } from "./_components/ScheduleCalendar";
import { DuplicateScheduleButton } from "./_components/DuplicateScheduleButton";

export const dynamic = "force-dynamic";

interface SessionInProgram {
  id: string;
  name: string;
  estimatedDurationMin: number | null;
  program: { id: string; name: string };
}

interface ScheduleDayRow {
  id: string;
  date: string;
  workoutSessionId: string | null;
  notes: string | null;
  workoutSession: SessionInProgram | null;
}

interface ScheduleDetail {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  client: {
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  };
  days: ScheduleDayRow[];
}

interface WorkoutOption {
  id: string;
  name: string;
  estimatedDurationMin: number | null;
  exerciseCount: number;
}

function fullName(u: ScheduleDetail["client"]["user"]) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
}

export default async function ScheduleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let schedule: ScheduleDetail | null = null;
  let workouts: WorkoutOption[] = [];
  let error: string | null = null;

  try {
    schedule = await apiFetchServer<ScheduleDetail>(`/schedules/${id}`);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load schedule";
  }

  try {
    workouts = await apiFetchServer<WorkoutOption[]>("/workouts");
  } catch {
    /* workouts list is optional — the calendar still renders */
  }

  if (!schedule) {
    return (
      <div className="space-y-4">
        <Link
          href="/coach/schedules"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to schedules
        </Link>
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">
            {error ?? "Schedule not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/coach/schedules"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to schedules
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-600">Schedule</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {schedule.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            For {fullName(schedule.client.user)} · starting{" "}
            {new Date(schedule.startDate).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <DuplicateScheduleButton
          scheduleId={schedule.id}
          scheduleName={schedule.name}
          sourceClientUserId={schedule.client.user.id}
        />
      </header>

      <ScheduleCalendar
        scheduleId={schedule.id}
        startDate={schedule.startDate}
        endDate={schedule.endDate}
        initialDays={schedule.days}
        workouts={workouts}
      />
    </div>
  );
}
