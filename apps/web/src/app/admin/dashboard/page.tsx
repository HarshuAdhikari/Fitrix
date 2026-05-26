import {
  Users,
  UserCheck,
  ClipboardList,
  Dumbbell,
  Mail,
  UserPlus,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";

export const dynamic = "force-dynamic";

interface PlatformStats {
  totalUsers: number;
  totalSuperAdmins: number;
  totalAdmins: number;
  totalCoaches: number;
  totalClients: number;
  totalPrograms: number;
  totalExercises: number;
  totalOrganizations: number;
  pendingInvitations: number;
  newUsersThisMonth: number;
}

export default async function AdminDashboardPage() {
  let stats: PlatformStats | null = null;
  let error: string | null = null;

  try {
    stats = await apiFetchServer<PlatformStats>("/admin/stats");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load stats";
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-violet-600">Admin console</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Platform overview
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Live snapshot across all coaches, clients, and content.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {stats ? (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={UserCheck}
              label="Super admins"
              value={stats.totalSuperAdmins}
              accent="violet"
            />
            <StatCard
              icon={Users}
              label="Org admins"
              value={stats.totalAdmins}
              accent="blue"
            />
            <StatCard
              icon={UserCheck}
              label="Total coaches"
              value={stats.totalCoaches}
              accent="emerald"
            />
            <StatCard
              icon={Users}
              label="Total clients"
              value={stats.totalClients}
              accent="amber"
            />
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              icon={ClipboardList}
              label="Programs"
              value={stats.totalPrograms}
              accent="emerald"
            />
            <StatCard
              icon={ClipboardList}
              label="Exercises"
              value={stats.totalExercises}
              accent="amber"
            />
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              icon={UserPlus}
              label="New users this month"
              value={stats.newUsersThisMonth}
              description="Registered in the last 30 days"
            />
            <MetricCard
              icon={Mail}
              label="Pending invitations"
              value={stats.pendingInvitations}
              description="Sent but not yet accepted"
            />
            <MetricCard
              icon={Building2}
              label="Organizations"
              value={stats.totalOrganizations}
              description="Customer workspaces"
            />
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              icon={Users}
              label="Total users"
              value={stats.totalUsers}
              description="Across all roles"
            />
          </section>
        </>
      ) : null}
    </div>
  );
}

const ACCENT_STYLES: Record<string, { tile: string; icon: string }> = {
  violet: {
    tile: "bg-violet-50",
    icon: "text-violet-700",
  },
  blue: {
    tile: "bg-blue-50",
    icon: "text-blue-700",
  },
  emerald: {
    tile: "bg-emerald-50",
    icon: "text-emerald-700",
  },
  amber: {
    tile: "bg-amber-50",
    icon: "text-amber-700",
  },
};

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  accent: string;
}) {
  const styles = ACCENT_STYLES[accent] ?? ACCENT_STYLES["violet"]!;
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
      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <p className="text-sm font-semibold text-slate-700">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}
