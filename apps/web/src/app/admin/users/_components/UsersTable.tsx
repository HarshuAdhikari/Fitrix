"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Eye, Mail, Search, Trash2, Loader2 } from "lucide-react";
import { createApiClient, ApiError } from "../../../../lib/api";

type Role = "SUPER_ADMIN" | "ADMIN" | "COACH" | "CLIENT";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  createdAt: string;
  isCoach: boolean;
  isClient: boolean;
}

const ROLE_STYLES: Record<Role, string> = {
  SUPER_ADMIN: "bg-rose-100 text-rose-700",
  ADMIN: "bg-violet-100 text-violet-700",
  COACH: "bg-blue-100 text-blue-700",
  CLIENT: "bg-slate-100 text-slate-600",
};

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UsersTable({
  initialUsers,
  currentUserId,
}: {
  initialUsers: User[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ").toLowerCase();
    return name.includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const handleDelete = async (userId: string, name: string) => {
    if (
      !confirm(
        `Delete ${name}? This soft-deletes the account — they will lose access immediately.`,
      )
    )
      return;
    setDeletingId(userId);
    try {
      const token = await getToken();
      const api = createApiClient(token);
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      router.refresh();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (!confirm(`Change this user's role to ${newRole}?`)) return;
    setUpdatingId(userId);
    try {
      const token = await getToken();
      const api = createApiClient(token);
      const updated = await api.patch<User>(`/admin/users/${userId}/role`, {
        role: newRole,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)),
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
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                User
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Current role
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
            {filtered.map((user) => {
              const name =
                [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                user.email;
              const busy = updatingId === user.id;
              const deleting = deletingId === user.id;
              const isSelf = currentUserId === user.id;
              const isSuperAdmin = user.role === "SUPER_ADMIN";
              const canDelete = !isSelf && !isSuperAdmin;
              return (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                        {initialsOf(name)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{name}</p>
                        <p className="flex items-center gap-1 text-xs text-slate-500">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_STYLES[user.role]}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/admin/support/users/${user.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-violet-50 hover:text-violet-700"
                        title="Support view"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <select
                        value={user.role}
                        disabled={busy || deleting}
                        onChange={(e) =>
                          void handleRoleChange(user.id, e.target.value as Role)
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="CLIENT">CLIENT</option>
                        <option value="COACH">COACH</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                      <button
                        type="button"
                        disabled={!canDelete || deleting || busy}
                        onClick={() => void handleDelete(user.id, name)}
                        title={
                          isSelf
                            ? "You cannot delete yourself"
                            : isSuperAdmin
                              ? "Super-admins cannot be deleted"
                              : "Delete user"
                        }
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                      >
                        {deleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
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
                  No users match your search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
