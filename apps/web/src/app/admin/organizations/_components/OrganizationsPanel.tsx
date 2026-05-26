import Link from "next/link";
import { Building2, Mail, Plus } from "lucide-react";

type OrganizationType = "GYM_OR_CHAIN" | "INDIVIDUAL_COACH";

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
  contactEmail: string | null;
  phone: string | null;
  owner: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    role: string;
  } | null;
  userCount: number;
  adminCount: number;
  coachCount: number;
  clientCount: number;
  programCount: number;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

function displayName(user: User | Organization["owner"]) {
  if (!user) return "No owner";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

export function OrganizationsPanel({
  initialOrganizations,
}: {
  initialOrganizations: Organization[];
  ownerCandidates: User[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          {initialOrganizations.length} customer workspace{initialOrganizations.length === 1 ? "" : "s"}
        </p>
        <Link
          href="/admin/organizations/new"
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          Add organization
        </Link>
      </div>

      {initialOrganizations.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-700">
            No organizations yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Use Add organization to create the first customer workspace.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <Th>Organization</Th>
                <Th>Owner</Th>
                <Th>Clients</Th>
                <Th>Coaches</Th>
                <Th>Programs</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialOrganizations.map((organization) => (
                <tr key={organization.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <Link href={`/admin/organizations/${organization.id}`}>
                      <p className="font-semibold text-slate-900">{organization.name}</p>
                      <p className="font-mono text-xs text-slate-500">{organization.slug}</p>
                      <p className="mt-1 text-xs text-violet-600">
                        {organization.type === "GYM_OR_CHAIN" ? "Gym / chain" : "Individual coach"}
                      </p>
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800">{displayName(organization.owner)}</p>
                    {organization.owner ? (
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <Mail className="h-3 w-3" />
                        {organization.owner.email}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{organization.clientCount}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{organization.coachCount}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{organization.programCount}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {new Date(organization.createdAt).toLocaleDateString()}
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}
