import { AlertCircle, Mail, Clock, CheckCircle2, XCircle } from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";

export const dynamic = "force-dynamic";

interface Invitation {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  coach: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  program: { id: string; name: string } | null;
}

interface PaginatedInvitations {
  data: Invitation[];
  total: number;
}

function displayName(user: { email: string; firstName: string | null; lastName: string | null }) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUS_STYLES: Record<Invitation["status"], string> = {
  PENDING: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  EXPIRED: "bg-amber-50 text-amber-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

export default async function AdminInvitationsPage() {
  let invitations: Invitation[] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const result = await apiFetchServer<PaginatedInvitations>(
      "/admin/invitations?pageSize=100",
    );
    invitations = result.data;
    total = result.total;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load invitations";
  }

  const pending = invitations.filter((i) => i.status === "PENDING").length;
  const accepted = invitations.filter((i) => i.status === "ACCEPTED").length;
  const expired = invitations.filter((i) => i.status === "EXPIRED").length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-violet-600">Admin console</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Invitations
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Platform-wide client invitation history across all coaches.
        </p>
      </header>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Metric icon={Mail} label="Total" value={total} />
        <Metric icon={Clock} label="Pending" value={pending} />
        <Metric icon={CheckCircle2} label="Accepted" value={accepted} />
        <Metric icon={XCircle} label="Expired" value={expired} />
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Client</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Coach</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Program</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Created</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invitations.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50/50">
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-900">
                    {[inv.firstName, inv.lastName].filter(Boolean).join(" ") || inv.email}
                  </p>
                  <p className="text-xs text-slate-500">{inv.email}</p>
                </td>
                <td className="px-5 py-4 text-slate-600">{displayName(inv.coach)}</td>
                <td className="px-5 py-4 text-slate-600">{inv.program?.name ?? "-"}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[inv.status]}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500">{formatDate(inv.createdAt)}</td>
                <td className="px-5 py-4 text-xs text-slate-500">{formatDate(inv.expiresAt)}</td>
              </tr>
            ))}
            {invitations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                  No invitations yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
    </div>
  );
}
