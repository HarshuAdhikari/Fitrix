import { AlertCircle, UserSquare } from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";
import { ClientsTable } from "./_components/ClientsTable";

export const dynamic = "force-dynamic";

interface CoachOption {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface ClientRow {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  goals: string[];
  coach: {
    id: string;
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    startedAt: string;
  } | null;
  program: { id: string; name: string } | null;
  workoutsLogged: number;
  lastWorkoutAt: string | null;
}

interface TeamMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface OrgProgram {
  id: string;
  name: string;
}

export default async function OrganizationClientsPage() {
  let clients: ClientRow[] = [];
  let coaches: CoachOption[] = [];
  let programs: OrgProgram[] = [];
  let error: string | null = null;

  try {
    const [c, team, progs] = await Promise.all([
      apiFetchServer<ClientRow[]>("/organizations/me/clients"),
      apiFetchServer<TeamMember[]>("/organizations/me/team"),
      apiFetchServer<OrgProgram[]>("/organizations/me/programs"),
    ]);
    clients = c;
    coaches = team
      .filter((m) => m.role === "COACH")
      .map((m) => ({
        id: m.id,
        email: m.email,
        firstName: m.firstName,
        lastName: m.lastName,
      }));
    programs = progs.map((p) => ({ id: p.id, name: p.name }));
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load clients";
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-emerald-600">
          Organization workspace
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Clients
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {clients.length} client{clients.length === 1 ? "" : "s"} active across
          your coaches.
        </p>
      </header>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-card">
          <UserSquare className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 font-semibold text-slate-900">No clients yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Add clients via the Team page — they'll appear here once their
            account is created.
          </p>
        </div>
      ) : (
        <ClientsTable clients={clients} coaches={coaches} programs={programs} />
      )}
    </div>
  );
}
