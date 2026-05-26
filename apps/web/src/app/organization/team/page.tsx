import { AlertCircle } from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";
import { TeamPageClient } from "./_components/TeamPageClient";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COACH" | "CLIENT";

interface TeamMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  createdAt: string;
  isOwner: boolean;
  isCoach: boolean;
  isClient: boolean;
}

export default async function OrganizationTeamPage() {
  let members: TeamMember[] = [];
  let error: string | null = null;

  try {
    members = await apiFetchServer<TeamMember[]>("/organizations/me/team");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load team";
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-600">
            Organization workspace
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Team
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {members.length} member{members.length === 1 ? "" : "s"} assigned to
            this organization.
          </p>
        </div>
      </header>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : (
        <TeamPageClient members={members} />
      )}
    </div>
  );
}
