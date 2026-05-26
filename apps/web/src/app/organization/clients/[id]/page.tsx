import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  CalendarDays,
  Ruler,
  Weight,
  Cake,
  Target,
  Stethoscope,
  AlertCircle,
  Dumbbell,
  User,
} from "lucide-react";
import { ApiError } from "../../../../lib/api";
import { apiFetchServer } from "../../../../lib/api-server";

export const dynamic = "force-dynamic";

interface ClientDetail {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    createdAt: string;
  };
  profile: {
    id: string;
    goals: string[];
    heightCm: number | null;
    weightKg: number | null;
    dateOfBirth: string | null;
    medicalNotes: string | null;
  };
  coach: {
    id: string;
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    startedAt: string;
  } | null;
}

interface ClientLogSet {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  rpe: number | null;
}

interface ClientLog {
  id: string;
  performedAt: string;
  notes: string | null;
  session: {
    id: string;
    name: string;
    weekNumber: number;
    dayNumber: number;
    program: { id: string; name: string } | null;
  };
  sets: ClientLogSet[];
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function OrgClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let client: ClientDetail | null = null;
  let loadError: string | null = null;
  let logs: ClientLog[] = [];

  try {
    client = await apiFetchServer<ClientDetail>(
      `/organizations/me/clients/${id}`,
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    loadError = e instanceof Error ? e.message : "Failed to load client";
  }

  try {
    logs = await apiFetchServer<ClientLog[]>(
      `/organizations/me/clients/${id}/logs?limit=10`,
    );
  } catch {
    /* empty list is fine */
  }

  if (!client) {
    return (
      <div className="space-y-4">
        <Link
          href="/organization/clients"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to clients
        </Link>
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">
            {loadError ?? "Client not found"}
          </p>
        </div>
      </div>
    );
  }

  const name =
    [client.user.firstName, client.user.lastName].filter(Boolean).join(" ") ||
    client.user.email;
  const coachName = client.coach
    ? [client.coach.firstName, client.coach.lastName]
        .filter(Boolean)
        .join(" ") || client.coach.email
    : null;

  return (
    <div className="space-y-6">
      <Link
        href="/organization/clients"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to clients
      </Link>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="relative h-20 bg-brand-gradient">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.15),_transparent_50%)]" />
        </div>
        <div className="relative z-10 px-8 pb-6">
          <div className="-mt-10 flex items-end gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-brand-gradient text-xl font-bold text-white shadow-lg">
              {initialsOf(name)}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {client.user.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Joined {formatDate(client.user.createdAt)}
                </span>
                {coachName ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                    <User className="h-3.5 w-3.5" />
                    Coach: {coachName}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    <User className="h-3.5 w-3.5" />
                    Unassigned
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          icon={Ruler}
          label="Height"
          value={
            client.profile.heightCm ? `${client.profile.heightCm} cm` : "—"
          }
        />
        <StatTile
          icon={Weight}
          label="Weight"
          value={
            client.profile.weightKg ? `${client.profile.weightKg} kg` : "—"
          }
        />
        <StatTile
          icon={Cake}
          label="Date of birth"
          value={formatDate(client.profile.dateOfBirth)}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Target className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Goals</h2>
          </div>
          {client.profile.goals.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No goals recorded.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {client.profile.goals.map((g) => (
                <li
                  key={g}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {g}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Stethoscope className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              Medical notes
            </h2>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">
            {client.profile.medicalNotes ?? "No notes."}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Recent logs</h2>
          <p className="text-sm text-slate-500">
            The latest workouts {client.user.firstName ?? "this client"} has
            submitted.
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <Dumbbell className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              No workouts logged yet.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {logs.map((log) => {
              const grouped = new Map<string, ClientLogSet[]>();
              for (const s of log.sets) {
                const arr = grouped.get(s.exerciseName) ?? [];
                arr.push(s);
                grouped.set(s.exerciseName, arr);
              }
              return (
                <li
                  key={log.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {log.session.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {log.session.program?.name ?? "Program"} · Week{" "}
                        {log.session.weekNumber} · Day {log.session.dayNumber}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(log.performedAt).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="px-5 py-4">
                    {grouped.size === 0 ? (
                      <p className="text-sm text-slate-500">
                        Marked complete with no sets recorded.
                      </p>
                    ) : (
                      <ul className="space-y-2.5">
                        {Array.from(grouped.entries()).map(([n, sets]) => (
                          <li key={n} className="text-sm">
                            <p className="font-medium text-slate-800">{n}</p>
                            <p className="mt-0.5 font-mono text-xs text-slate-500">
                              {sets
                                .map(
                                  (s) =>
                                    `Set ${s.setNumber}: ${s.reps ?? "—"} reps${
                                      s.weightKg !== null
                                        ? ` × ${s.weightKg} kg`
                                        : ""
                                    }`,
                                )
                                .join("  ·  ")}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                    {log.notes ? (
                      <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs italic text-slate-600">
                        “{log.notes}”
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Ruler;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
