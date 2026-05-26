import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bell, Dumbbell, Mail, Shield, User, Users } from "lucide-react";
import { ApiError } from "../../../../../lib/api";
import { apiFetchServer } from "../../../../../lib/api-server";

export const dynamic = "force-dynamic";

interface UserSupportDetail {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "COACH" | "CLIENT";
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
  coachProfile: {
    id: string;
    specialties: string[];
    yearsOfExperience: number | null;
    timezone: string | null;
    clientCount: number;
    programCount: number;
    invitationCount: number;
  } | null;
  clientProfile: {
    id: string;
    goals: string[];
    heightCm: number | null;
    weightKg: number | null;
    coachCount: number;
    workoutLogCount: number;
    mealLogCount: number;
    paymentCount: number;
  } | null;
  notifications: Array<{
    id: string;
    title: string;
    body: string | null;
    readAt: string | null;
    createdAt: string;
  }>;
}

function nameOf(user: UserSupportDetail) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminUserSupportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let user: UserSupportDetail | null = null;
  let error: string | null = null;

  try {
    user = await apiFetchServer<UserSupportDetail>(`/admin/users/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    error = e instanceof Error ? e.message : "Failed to load user";
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ?? "User not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-lg font-bold text-violet-700">
              {nameOf(user).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {nameOf(user)}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            {user.role}
          </span>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Info label="User ID" value={user.id} />
          <Info label="Clerk ID" value={user.clerkId} />
          <Info label="Created" value={formatDate(user.createdAt)} />
          <Info label="Updated" value={formatDate(user.updatedAt)} />
        </dl>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProfileCard
          title="Coach profile"
          icon={Dumbbell}
          empty="This user does not have a coach profile."
        >
          {user.coachProfile ? (
            <>
              <Metric label="Clients" value={user.coachProfile.clientCount} />
              <Metric label="Programs" value={user.coachProfile.programCount} />
              <Metric label="Invitations" value={user.coachProfile.invitationCount} />
              <Info label="Timezone" value={user.coachProfile.timezone ?? "-"} />
            </>
          ) : null}
        </ProfileCard>

        <ProfileCard
          title="Client profile"
          icon={User}
          empty="This user does not have a client profile."
        >
          {user.clientProfile ? (
            <>
              <Metric label="Coaches" value={user.clientProfile.coachCount} />
              <Metric label="Workout logs" value={user.clientProfile.workoutLogCount} />
              <Metric label="Meal logs" value={user.clientProfile.mealLogCount} />
              <Metric label="Payments" value={user.clientProfile.paymentCount} />
            </>
          ) : null}
        </ProfileCard>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900">Recent notifications</h2>
        </div>
        {user.notifications.length === 0 ? (
          <p className="text-sm text-slate-500">No notifications found.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {user.notifications.map((n) => (
              <div key={n.id} className="py-3">
                <p className="font-medium text-slate-900">{n.title}</p>
                {n.body ? <p className="mt-1 text-sm text-slate-600">{n.body}</p> : null}
                <p className="mt-1 text-xs text-slate-400">{formatDate(n.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/users"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to users
    </Link>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-1 break-all text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value.toLocaleString()}</p>
    </div>
  );
}

function ProfileCard({
  title,
  icon: Icon,
  children,
  empty,
}: {
  title: string;
  icon: typeof Shield;
  children: React.ReactNode;
  empty: string;
}) {
  const hasChildren = Boolean(children);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      {hasChildren ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
      ) : (
        <p className="text-sm text-slate-500">{empty}</p>
      )}
    </section>
  );
}
