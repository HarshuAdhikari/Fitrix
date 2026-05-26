import { AlertCircle } from "lucide-react";
import { apiFetchServer } from "../../../../lib/api-server";
import { CreateOrganizationForm } from "../_components/CreateOrganizationForm";

export const dynamic = "force-dynamic";

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

export default async function NewOrganizationPage() {
  let ownerCandidates: User[] = [];
  let error: string | null = null;

  try {
    const users = await apiFetchServer<PaginatedUsers>("/admin/users?pageSize=200");
    ownerCandidates = users.data.filter((user) => user.role !== "SUPER_ADMIN");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load owner candidates";
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-violet-600">Admin console</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Add organization
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create a customer workspace and provision owner access.
        </p>
      </header>
      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : (
        <CreateOrganizationForm ownerCandidates={ownerCandidates} />
      )}
    </div>
  );
}
