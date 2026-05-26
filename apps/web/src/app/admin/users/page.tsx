import { AlertCircle } from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";
import { UsersTable } from "./_components/UsersTable";

export const dynamic = "force-dynamic";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "COACH" | "CLIENT";
  createdAt: string;
  isCoach: boolean;
  isClient: boolean;
}

interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
}

export default async function AdminUsersPage() {
  let users: User[] = [];
  let total = 0;
  let error: string | null = null;
  let currentUserId: string | null = null;

  try {
    const result = await apiFetchServer<PaginatedUsers>(
      "/admin/users?pageSize=100",
    );
    users = result.data;
    total = result.total;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load users";
  }

  try {
    const me = await apiFetchServer<{ id: string }>("/users/me");
    currentUserId = me.id;
  } catch {
    /* if /users/me fails the delete guard just disables for all rows */
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-violet-600">Admin console</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          All users
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {total} user{total === 1 ? "" : "s"} across the platform. Change roles
          directly from this table.
        </p>
      </header>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : (
        <UsersTable initialUsers={users} currentUserId={currentUserId} />
      )}
    </div>
  );
}
