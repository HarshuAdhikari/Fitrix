import Link from "next/link";
import { Mail, Plus, UserCheck } from "lucide-react";

interface Coach {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
  hasProfile: boolean;
  clientCount: number;
  programCount: number;
  invitationCount: number;
  bio: string | null;
  specialties: string[];
  yearsOfExperience: number | null;
  timezone: string | null;
}

function nameOf(coach: Pick<Coach, "firstName" | "lastName" | "email">) {
  return [coach.firstName, coach.lastName].filter(Boolean).join(" ") || coach.email;
}

function initialsOf(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AdminCoachesPanel({ initialCoaches }: { initialCoaches: Coach[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          {initialCoaches.length} independent coach{initialCoaches.length === 1 ? "" : "es"}
        </p>
        <Link
          href="/admin/coaches/new"
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          Add coach
        </Link>
      </div>

      {initialCoaches.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <UserCheck className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-700">
            No independent coaches yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Use Add coach to manually provision the first account.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <Th>Coach</Th>
                <Th>Contact</Th>
                <Th>Clients</Th>
                <Th>Programs</Th>
                <Th>Invites</Th>
                <Th>Joined</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialCoaches.map((coach) => {
                const name = nameOf(coach);
                return (
                  <tr key={coach.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <Link href={`/admin/coaches/${coach.id}`} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-700">
                          {initialsOf(name)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{name}</p>
                          <p className="text-xs text-slate-500">
                            {coach.specialties.length ? coach.specialties.join(", ") : "No specialties"}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {coach.email}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{coach.phone ?? "-"}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{coach.clientCount}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{coach.programCount}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{coach.invitationCount}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(coach.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
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
