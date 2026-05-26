"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Mail, Search, ShieldCheck } from "lucide-react";
import { ApiError, createApiClient } from "../../../../lib/api";

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

const ROLE_STYLES: Record<Role, string> = {
  ADMIN: "bg-emerald-100 text-emerald-700",
  COACH: "bg-blue-100 text-blue-700",
  CLIENT: "bg-slate-100 text-slate-600",
};

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function OrganizationTeamTable({
  initialMembers,
}: {
  initialMembers: TeamMember[];
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = members.filter((member) => {
    const q = search.toLowerCase();
    const name = [member.firstName, member.lastName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      name.includes(q) ||
      member.email.toLowerCase().includes(q) ||
      member.role.toLowerCase().includes(q)
    );
  });

  const handleRoleChange = async (userId: string, role: Role) => {
    if (!confirm(`Change this team member's role to ${role}?`)) return;
    setUpdatingId(userId);
    try {
      const token = await getToken();
      const api = createApiClient(token);
      const updated = await api.patch<TeamMember>(
        `/organizations/me/team/${userId}/role`,
        { role },
      );
      setMembers((current) =>
        current.map((member) =>
          member.id === userId ? { ...member, role: updated.role } : member,
        ),
      );
      router.refresh();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search team..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Team member
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Role
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Joined
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((member) => {
              const name =
                [member.firstName, member.lastName].filter(Boolean).join(" ") ||
                member.email;
              const busy = updatingId === member.id;
              return (
                <tr
                  key={member.id}
                  className="transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                        {initialsOf(name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{name}</p>
                          {member.isOwner ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                              title="Organization owner"
                            >
                              <ShieldCheck className="h-3 w-3" />
                              Owner
                            </span>
                          ) : null}
                        </div>
                        <p className="flex items-center gap-1 text-xs text-slate-500">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_STYLES[member.role]}`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {new Date(member.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <select
                      value={member.role}
                      disabled={busy || member.isOwner}
                      onChange={(e) =>
                        void handleRoleChange(member.id, e.target.value as Role)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="CLIENT">CLIENT</option>
                      <option value="COACH">COACH</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-10 text-center text-sm text-slate-400"
                >
                  No team members match your search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
