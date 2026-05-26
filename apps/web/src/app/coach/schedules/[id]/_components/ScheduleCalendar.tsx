"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Loader2,
  Trash2,
  Dumbbell,
  Search,
} from "lucide-react";
import { ApiError, createApiClient } from "../../../../../lib/api";

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

interface WorkoutOption {
  id: string;
  name: string;
  estimatedDurationMin: number | null;
  exerciseCount: number;
}

interface Props {
  scheduleId: string;
  startDate: string;
  endDate: string | null;
  initialDays: ScheduleDayRow[];
  workouts: WorkoutOption[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseYmd(s: string): Date {
  return new Date(`${s.slice(0, 10)}T00:00:00.000Z`);
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setUTCDate(c.getUTCDate() + n);
  return c;
}

/** Returns the Monday on or before this date (UTC). */
function startOfWeek(d: Date): Date {
  const c = new Date(d);
  const dow = c.getUTCDay(); // 0 = Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  c.setUTCDate(c.getUTCDate() + diff);
  return c;
}

function fmtDayLong(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtRange(start: Date, end: Date): string {
  const a = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const b = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const y = end.getUTCFullYear();
  return `${a} – ${b} ${y}`;
}

export function ScheduleCalendar({
  scheduleId,
  startDate,
  endDate,
  initialDays,
  workouts,
}: Props) {
  const { getToken } = useAuth();
  const scheduleStart = startOfWeek(parseYmd(startDate));
  const scheduleEnd = endDate ? parseYmd(endDate) : addDays(scheduleStart, 7 * 11 + 6);

  const totalWeeks = useMemo(() => {
    const days = Math.floor(
      (scheduleEnd.getTime() - scheduleStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    return Math.max(1, Math.ceil((days + 1) / 7));
  }, [scheduleStart, scheduleEnd]);

  // Find the week index that contains today, or 0 if today is before start.
  const todayWeekIdx = useMemo(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (today < scheduleStart) return 0;
    const days = Math.floor(
      (today.getTime() - scheduleStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    return Math.min(totalWeeks - 1, Math.floor(days / 7));
  }, [scheduleStart, totalWeeks]);

  const [weekIdx, setWeekIdx] = useState(todayWeekIdx);
  const [days, setDays] = useState<Record<string, ScheduleDayRow>>(() => {
    const map: Record<string, ScheduleDayRow> = {};
    for (const d of initialDays) map[d.date.slice(0, 10)] = d;
    return map;
  });
  const [pickerOpenFor, setPickerOpenFor] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const weekStart = addDays(scheduleStart, weekIdx * 7);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const todayYmd = ymd(new Date());

  const setDayWorkout = async (
    dateYmd: string,
    workoutSessionId: string | null,
  ) => {
    setPending(dateYmd);
    try {
      const token = await getToken();
      const api = createApiClient(token);
      const row = await api.put<ScheduleDayRow>(`/schedules/${scheduleId}/days`, {
        date: dateYmd,
        workoutSessionId,
      });
      // The server returns the row but without the joined workoutSession; rebuild
      // it locally so the card updates immediately.
      const picked = workoutSessionId
        ? workouts.find((w) => w.id === workoutSessionId)
        : null;
      const session = picked
        ? {
            id: picked.id,
            name: picked.name,
            estimatedDurationMin: picked.estimatedDurationMin,
            program: { id: picked.id, name: picked.name },
          }
        : null;
      setDays((prev) => ({
        ...prev,
        [dateYmd]: { ...row, workoutSession: session },
      }));
    } catch (err) {
      alert(
        err instanceof ApiError ? err.message : "Failed to update day",
      );
    } finally {
      setPending(null);
      setPickerOpenFor(null);
    }
  };

  const clearDay = async (dateYmd: string) => {
    setPending(dateYmd);
    try {
      const token = await getToken();
      const api = createApiClient(token);
      await api.delete(`/schedules/${scheduleId}/days?date=${dateYmd}`);
      setDays((prev) => {
        const copy = { ...prev };
        delete copy[dateYmd];
        return copy;
      });
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to clear day");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex min-h-[600px] gap-4">
      {/* Week strip */}
      <aside className="hidden w-48 shrink-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-card lg:block">
        {Array.from({ length: totalWeeks }, (_, i) => {
          const wStart = addDays(scheduleStart, i * 7);
          const wEnd = addDays(wStart, 6);
          const active = i === weekIdx;
          const isCurrent = i === todayWeekIdx;
          return (
            <button
              key={i}
              onClick={() => setWeekIdx(i)}
              className={[
                "group relative mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              <p
                className={[
                  "font-medium",
                  active ? "text-brand-700" : "text-slate-700",
                ].join(" ")}
              >
                {fmtRange(wStart, wEnd).split(" ").slice(0, -1).join(" ")}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">Week {i + 1}</p>
              {isCurrent ? (
                <span className="absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-brand-500" />
              ) : null}
            </button>
          );
        })}
      </aside>

      {/* Calendar pane */}
      <section className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-center gap-4 border-b border-slate-100 pb-4">
          <button
            onClick={() => setWeekIdx((i) => Math.max(0, i - 1))}
            disabled={weekIdx === 0}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-slate-800">
            {fmtRange(weekStart, addDays(weekStart, 6))}
          </p>
          <button
            onClick={() =>
              setWeekIdx((i) => Math.min(totalWeeks - 1, i + 1))
            }
            disabled={weekIdx >= totalWeeks - 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {weekDays.map((d, i) => {
            const key = ymd(d);
            const day = days[key] ?? null;
            const isToday = key === todayYmd;
            const isPending = pending === key;
            return (
              <div
                key={key}
                className={[
                  "rounded-xl border bg-white p-4 transition-colors",
                  isToday
                    ? "border-brand-200 bg-brand-50/40"
                    : "border-slate-200",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {DAY_LABELS[i]}, {fmtDayLong(d).split(", ")[1]}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Week {weekIdx + 1} · Day {i + 1}
                      {isToday ? (
                        <span className="ml-2 inline-flex items-center rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                          Today
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  {day?.workoutSession ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-100 bg-white p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                          <Dumbbell className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {day.workoutSession.name}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {day.workoutSession.program.name}
                            {day.workoutSession.estimatedDurationMin
                              ? ` · ${day.workoutSession.estimatedDurationMin} min`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPickerOpenFor(key)}
                          disabled={isPending}
                          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          title="Swap workout"
                        >
                          Swap
                        </button>
                        <button
                          onClick={() => void clearDay(key)}
                          disabled={isPending}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Clear"
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPickerOpenFor(key)}
                      disabled={isPending}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Add Workout
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {pickerOpenFor ? (
        <WorkoutPicker
          workouts={workouts}
          onClose={() => setPickerOpenFor(null)}
          onPick={(sessionId) => void setDayWorkout(pickerOpenFor!, sessionId)}
          targetDate={pickerOpenFor}
        />
      ) : null}
    </div>
  );
}

function WorkoutPicker({
  workouts,
  onClose,
  onPick,
  targetDate,
}: {
  workouts: WorkoutOption[];
  onClose: () => void;
  onPick: (sessionId: string) => void;
  targetDate: string;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return workouts;
    return workouts.filter((w) => w.name.toLowerCase().includes(needle));
  }, [workouts, q]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Add workout to {targetDate}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Pick a program from your library.
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-b border-slate-100 px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search programs…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No programs match. Build one first under{" "}
              <a href="/coach/plans" className="text-brand-600 underline">
                Programs
              </a>
              .
            </p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((w) => (
                <li key={w.id}>
                  <button
                    onClick={() => onPick(w.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-brand-200 hover:bg-brand-50/50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{w.name}</p>
                      <p className="text-xs text-slate-500">
                        {w.exerciseCount} exercise
                        {w.exerciseCount === 1 ? "" : "s"}
                        {w.estimatedDurationMin
                          ? ` · ${w.estimatedDurationMin} min`
                          : ""}
                      </p>
                    </div>
                    <Plus className="h-4 w-4 text-slate-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
