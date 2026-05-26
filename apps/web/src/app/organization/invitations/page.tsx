import { AlertCircle, Mail } from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";

export const dynamic = "force-dynamic";

type InvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "EXPIRED"
  | "CANCELLED";

interface InvitationRow {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  coach: {
    id: string;
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  program: { id: string; name: string } | null;
}

const STATUS_BADGE: Record<InvitationStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-red-100 text-red-700",
};

function fullName(u: { firstName: string | null; lastName: string | null; email: string }) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
}

export default async function OrganizationInvitationsPage() {
  let invitations: InvitationRow[] = [];
  let error: string | null = null;

  try {
    invitations = await apiFetchServer<InvitationRow[]>(
      "/organizations/me/invitations",
    );
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load invitations";
  }

  const counts = invitations.reduce<Record<InvitationStatus, number>>(
    (acc, i) => {
      acc[i.status] = (acc[i.status] ?? 0) + 1;
      return acc;
    },
    { PENDING: 0, ACCEPTED: 0, EXPIRED: 0, CANCELLED: 0 },
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-emerald-600">
          Organization workspace
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Invitations
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {invitations.length} total · {counts.PENDING} pending · {counts.ACCEPTED}{" "}
          accepted
        </p>
      </header>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : invitations.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-card">
          <Mail className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 font-semibold text-slate-900">No invitations sent</p>
          <p className="mt-1 text-sm text-slate-500">
            Invitations sent by your coaches will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Invitee</th>
                <th className="px-5 py-3">Sent by</th>
                <th className="px-5 py-3">Program</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Sent</th>
                <th className="px-5 py-3">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invitations.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-900">
                      {[i.firstName, i.lastName].filter(Boolean).join(" ") ||
                        "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{i.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {fullName(i.coach)}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {i.program?.name ?? (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[i.status]}`}
                    >
                      {i.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {new Date(i.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {new Date(i.expiresAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
