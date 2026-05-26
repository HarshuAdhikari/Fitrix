import { AlertCircle } from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";
import { AdminCoachesPanel } from "./_components/AdminCoachesPanel";

export const dynamic = "force-dynamic";

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

export default async function AdminCoachesPage() {
  let coaches: Coach[] = [];
  let error: string | null = null;

  try {
    coaches = await apiFetchServer<Coach[]>("/admin/coaches");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load coaches";
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-violet-600">Admin console</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Independent coaches
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Add and manage coaches who are not owned by a gym organization.
        </p>
      </header>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : (
        <AdminCoachesPanel initialCoaches={coaches} />
      )}
    </div>
  );
}
