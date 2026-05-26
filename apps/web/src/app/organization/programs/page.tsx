import { AlertCircle, ClipboardList, Users } from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";
import { CreateProgramButton } from "./_components/CreateProgramButton";

export const dynamic = "force-dynamic";

interface ProgramRow {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
  durationWeeks: number;
  createdAt: string;
  coach: {
    id: string;
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  sessionCount: number;
  assignedClientCount: number;
}

function fullName(u: { firstName: string | null; lastName: string | null; email: string }) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
}

export default async function OrganizationProgramsPage() {
  let programs: ProgramRow[] = [];
  let error: string | null = null;

  try {
    programs = await apiFetchServer<ProgramRow[]>("/organizations/me/programs");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load programs";
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-600">
            Organization workspace
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Programs
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {programs.length} program{programs.length === 1 ? "" : "s"} created
            by coaches in this organization.
          </p>
        </div>
        <CreateProgramButton />
      </header>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : programs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-card">
          <ClipboardList className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 font-semibold text-slate-900">No programs yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Programs created by your coaches will show up here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Program</th>
                <th className="px-5 py-3">Coach</th>
                <th className="px-5 py-3">Difficulty</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Sessions</th>
                <th className="px-5 py-3">Clients</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {programs.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    {p.description ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {p.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {fullName(p.coach)}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {p.difficulty}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {p.durationWeeks} wk
                  </td>
                  <td className="px-5 py-3 text-slate-700">{p.sessionCount}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 text-slate-700">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {p.assignedClientCount}
                    </span>
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
