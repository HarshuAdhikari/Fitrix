import { AlertCircle } from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";
import { OrganizationsPanel } from "./_components/OrganizationsPanel";

export const dynamic = "force-dynamic";

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: "GYM_OR_CHAIN" | "INDIVIDUAL_COACH";
  contactEmail: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  notes: string | null;
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
  ownerTemporaryPassword?: string;
}

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface PaginatedUsers {
  data: User[];
}

export default async function AdminOrganizationsPage() {
  let organizations: Organization[] = [];
  let ownerCandidates: User[] = [];
  let error: string | null = null;

  try {
    const [orgs, users] = await Promise.all([
      apiFetchServer<Organization[]>("/organizations"),
      apiFetchServer<PaginatedUsers>("/admin/users?pageSize=200"),
    ]);
    organizations = orgs;
    ownerCandidates = users.data.filter((user) => user.role !== "SUPER_ADMIN");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load organizations";
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-violet-600">Admin console</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Organizations
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create customer workspaces and assign gym owners or business admins.
        </p>
      </header>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : (
        <OrganizationsPanel
          initialOrganizations={organizations}
          ownerCandidates={ownerCandidates}
        />
      )}
    </div>
  );
}
