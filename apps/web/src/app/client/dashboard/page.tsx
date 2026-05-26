import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Mail,
  Target,
  TrendingUp,
  User,
} from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";

export const dynamic = "force-dynamic";

interface MeResponse {
  user: { id: string; email: string; firstName: string | null; lastName: string | null };
  profile: { id: string; goals: string[]; heightCm: number | null; weightKg: number | null };
  coach: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    startedAt: string;
  } | null;
  activeProgram: {
    id: string;
    name: string;
    description: string | null;
    durationWeeks: number;
    startDate: string | null;
    difficulty: string;
  } | null;
  stats: { totalWorkoutsLogged: number };
}

function fullName(p: { firstName: string | null; lastName: string | null; email?: string }) {
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email || "—";
}

export default async function ClientDashboardPage() {
  let me: MeResponse | null = null;
  let error: string | null = null;
  try {
    me = await apiFetchServer<MeResponse>("/client/me");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load";
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!me) return null;

  const firstName = me.user.firstName ?? "there";

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-amber-600">Welcome back</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Hi, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here's your training snapshot for today.
        </p>
      </header>

      {/* Active program card */}
      {me.activeProgram ? (
        <section className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-6 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Current program
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {me.activeProgram.name}
              </h2>
              {me.activeProgram.description ? (
                <p className="mt-2 max-w-xl text-sm text-slate-600">
                  {me.activeProgram.description}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {me.activeProgram.durationWeeks} weeks
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" />
                  {me.activeProgram.difficulty}
                </span>
                {me.activeProgram.startDate ? (
                  <span>
                    Started{" "}
                    {new Date(me.activeProgram.startDate).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  </span>
                ) : null}
              </div>
            </div>
            <Link
              href="/client/program"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
            >
              Open
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-card">
          <Calendar className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">
            No program assigned yet
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your coach hasn't assigned a training plan to you. Check back soon
            or message them directly.
          </p>
        </section>
      )}

      {/* Quick stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={CheckCircle2}
          label="Workouts logged"
          value={me.stats.totalWorkoutsLogged}
          accent="amber"
        />
        <StatCard
          icon={TrendingUp}
          label="Goals"
          value={me.profile.goals.length}
          accent="emerald"
        />
        <StatCard
          icon={User}
          label="Coach"
          value={me.coach ? fullName(me.coach) : "—"}
          accent="blue"
          textValue
        />
      </section>

      {/* Coach + goals */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Your coach
          </h3>
          {me.coach ? (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-base font-semibold text-blue-700">
                {(me.coach.firstName?.[0] ?? me.coach.email[0] ?? "?").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-slate-900">
                  {fullName(me.coach)}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Mail className="h-3 w-3" />
                  {me.coach.email}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              You don't have an active coach right now.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Your goals
          </h3>
          {me.profile.goals.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No goals set yet. Talk to your coach about what you want to work
              on.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {me.profile.goals.map((g) => (
                <li
                  key={g}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  <Target className="h-4 w-4 text-amber-500" />
                  {g}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

const ACCENT_STYLES: Record<string, { tile: string; icon: string }> = {
  amber: { tile: "bg-amber-50", icon: "text-amber-700" },
  emerald: { tile: "bg-emerald-50", icon: "text-emerald-700" },
  blue: { tile: "bg-blue-50", icon: "text-blue-700" },
};

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  textValue = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  accent: string;
  textValue?: boolean;
}) {
  const styles = ACCENT_STYLES[accent] ?? ACCENT_STYLES["amber"]!;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${styles.tile} ${styles.icon}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
      </div>
      <p
        className={`mt-3 font-bold text-slate-900 ${textValue ? "text-lg" : "text-3xl"}`}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
