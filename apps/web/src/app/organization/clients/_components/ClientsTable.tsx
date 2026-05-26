"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { CheckCircle2, Loader2 } from "lucide-react";
import { ApiError, createApiClient } from "../../../../lib/api";

interface CoachOption {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface ProgramOption {
  id: string;
  name: string;
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

function fullName(u: { firstName: string | null; lastName: string | null; email: string }) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
}

export function ClientsTable({
  clients: initial,
  coaches,
  programs,
}: {
  clients: ClientRow[];
  coaches: CoachOption[];
  programs: ProgramOption[];
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [clients, setClients] = useState(initial);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assigningProgramId, setAssigningProgramId] = useState<string | null>(
    null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAssign = async (clientId: string, coachUserId: string) => {
    if (!coachUserId) return;
    setAssigningId(clientId);
    setErrors((prev) => ({ ...prev, [clientId]: "" }));
    try {
      const token = await getToken();
      const api = createApiClient(token);
      await api.post(
        `/organizations/me/clients/${clientId}/assign/${coachUserId}`,
        {},
      );
      // Optimistically update the coach shown.
      const coach = coaches.find((c) => c.id === coachUserId);
      if (coach) {
        setClients((prev) =>
          prev.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  coach: {
                    id: "",
                    userId: coach.id,
                    email: coach.email,
                    firstName: coach.firstName,
                    lastName: coach.lastName,
                    startedAt: new Date().toISOString(),
                  },
                }
              : c,
          ),
        );
      }
      router.refresh();
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [clientId]: err instanceof ApiError ? err.message : "Failed to assign",
      }));
    } finally {
      setAssigningId(null);
    }
  };

  const handleAssignProgram = async (clientId: string, programId: string) => {
    if (!programId) return;
    setAssigningProgramId(clientId);
    setErrors((prev) => ({ ...prev, [clientId]: "" }));
    try {
      const token = await getToken();
      const api = createApiClient(token);
      await api.post(
        `/organizations/me/clients/${clientId}/assign-program/${programId}`,
        {},
      );
      const program = programs.find((p) => p.id === programId);
      if (program) {
        setClients((prev) =>
          prev.map((c) =>
            c.id === clientId
              ? { ...c, program: { id: program.id, name: program.name } }
              : c,
          ),
        );
      }
      router.refresh();
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [clientId]:
          err instanceof ApiError ? err.message : "Failed to assign program",
      }));
    } finally {
      setAssigningProgramId(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-5 py-3">Client</th>
            <th className="px-5 py-3">Program</th>
            <th className="px-5 py-3">Workouts</th>
            <th className="px-5 py-3">Last workout</th>
            <th className="px-5 py-3">Assigned coach</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {clients.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50/60">
              <td className="px-5 py-3">
                <Link
                  href={`/organization/clients/${c.id}`}
                  className="font-semibold text-slate-900 hover:text-brand-700 hover:underline"
                >
                  {fullName(c)}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">{c.email}</p>
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  {programs.length === 0 ? (
                    c.program ? (
                      <span className="text-slate-700">{c.program.name}</span>
                    ) : (
                      <span className="text-xs text-slate-400">No program</span>
                    )
                  ) : (
                    <>
                      <select
                        defaultValue={c.program?.id ?? ""}
                        disabled={assigningProgramId === c.id}
                        onChange={(e) =>
                          void handleAssignProgram(c.id, e.target.value)
                        }
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
                      >
                        <option value="">— no program —</option>
                        {programs.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      {assigningProgramId === c.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                      ) : c.program ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : null}
                    </>
                  )}
                </div>
              </td>
              <td className="px-5 py-3 text-slate-700">{c.workoutsLogged}</td>
              <td className="px-5 py-3 text-slate-700">
                {c.lastWorkoutAt
                  ? new Date(c.lastWorkoutAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : (
                    <span className="text-xs text-slate-400">Never</span>
                  )}
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  {coaches.length === 0 ? (
                    <span className="text-xs text-slate-400">
                      No coaches in org
                    </span>
                  ) : (
                    <>
                      <select
                        defaultValue={c.coach?.userId ?? ""}
                        disabled={assigningId === c.id}
                        onChange={(e) =>
                          void handleAssign(c.id, e.target.value)
                        }
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
                      >
                        <option value="">— unassigned —</option>
                        {coaches.map((coach) => (
                          <option key={coach.id} value={coach.id}>
                            {fullName(coach)}
                          </option>
                        ))}
                      </select>
                      {assigningId === c.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                      ) : c.coach ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : null}
                    </>
                  )}
                </div>
                {errors[c.id] ? (
                  <p className="mt-1 text-xs text-red-600">{errors[c.id]}</p>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
