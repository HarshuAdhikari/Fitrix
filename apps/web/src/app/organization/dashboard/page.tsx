import {
  AlertCircle,
  ClipboardList,
  Mail,
  ShieldCheck,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";

export const dynamic = "force-dynamic";

interface OrganizationOverview {
  id: string;
  name: string;
  slug: string;
  owner: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
  } | null;
  stats: {
    admins: number;
    coaches: number;
    clients: number;
    programs: number;
    pendingInvitations: number;
  };
}

const METRICS = [
  {
    key: "admins",
    label: "Admins",
    icon: ShieldCheck,
    tone: "bg-emerald-600",
  },
  {
    key: "coaches",
    label: "Coaches",
    icon: UserRoundCheck,
    tone: "bg-blue-600",
  },
  {
    key: "clients",
    label: "Clients",
    icon: Users,
    tone: "bg-cyan-600",
  },
  {
    key: "programs",
    label: "Programs",
    icon: ClipboardList,
    tone: "bg-violet-600",
  },
] as const;

export default async function OrganizationDashboardPage() {
  let organization: OrganizationOverview | null = null;
  let error: string | null = null;

  try {
    organization =
      await apiFetchServer<OrganizationOverview>("/organizations/me");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load organization";
  }

  if (error || !organization) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  const ownerName =
    organization.owner &&
    ([organization.owner.firstName, organization.owner.lastName]
      .filter(Boolean)
      .join(" ") ||
      organization.owner.email);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-emerald-600">
          Organization workspace
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {organization.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage team access, coaches, clients, and programs for this business.
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.key}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${metric.tone}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-6 text-3xl font-bold text-slate-900">
                {organization.stats[metric.key]}
              </p>
              <p className="mt-1 text-sm text-slate-500">{metric.label}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">
            Ownership
          </h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Owner</dt>
              <dd className="text-right font-medium text-slate-900">
                {ownerName || "Not assigned"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Slug</dt>
              <dd className="font-mono text-xs font-semibold text-slate-900">
                {organization.slug}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Pending invitations
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Invitations created by coaches in this organization.
              </p>
              <p className="mt-5 text-3xl font-bold text-slate-900">
                {organization.stats.pendingInvitations}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
