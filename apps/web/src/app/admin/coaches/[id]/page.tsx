import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, UserCheck } from "lucide-react";
import { apiFetchServer } from "../../../../lib/api-server";
import { CoachDetailActions } from "../_components/CoachDetailActions";

export const dynamic = "force-dynamic";

interface CoachDetail {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
  coachProfile: {
    bio: string | null;
    specialties: string[];
    yearsOfExperience: number | null;
    timezone: string | null;
    clientCount: number;
    programCount: number;
    invitationCount: number;
    programs: {
      id: string;
      name: string;
      durationWeeks: number;
      difficulty: string;
      createdAt: string;
    }[];
    invitations: {
      id: string;
      email: string;
      status: string;
      createdAt: string;
    }[];
  } | null;
}

function fullName(coach: CoachDetail) {
  return [coach.firstName, coach.lastName].filter(Boolean).join(" ") || coach.email;
}

export default async function CoachDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let coach: CoachDetail;
  try {
    coach = await apiFetchServer<CoachDetail>(`/admin/coaches/${id}`);
  } catch {
    notFound();
  }

  const profile = coach.coachProfile;

  return (
    <div className="space-y-6">
      <Link href="/admin/coaches" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to coaches
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-violet-600">Independent coach</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {fullName(coach)}
          </h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" />{coach.email}</span>
            <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" />{coach.phone ?? "-"}</span>
          </div>
        </div>
        <CoachDetailActions coach={coach} />
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Clients" value={profile?.clientCount ?? 0} />
        <Metric label="Programs" value={profile?.programCount ?? 0} />
        <Metric label="Invites" value={profile?.invitationCount ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="font-semibold text-slate-900">Profile</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Info label="Timezone" value={profile?.timezone ?? "-"} />
            <Info label="Experience" value={profile?.yearsOfExperience === null || profile?.yearsOfExperience === undefined ? "-" : `${profile.yearsOfExperience} years`} />
            <Info label="Specialties" value={profile?.specialties.length ? profile.specialties.join(", ") : "-"} />
            <Info label="Joined" value={new Date(coach.createdAt).toLocaleDateString()} />
          </div>
          <Info label="Bio" value={profile?.bio ?? "-"} className="mt-5" />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <UserCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-semibold text-slate-900">Account scope</h2>
          <p className="mt-1 text-sm text-slate-500">
            This is an independent coach account, separate from organization-employed coaches.
          </p>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Recent programs</h2>
        </div>
        <SimpleTable
          empty="No programs yet."
          rows={(profile?.programs ?? []).map((program) => [
            program.name,
            program.difficulty,
            `${program.durationWeeks} weeks`,
            new Date(program.createdAt).toLocaleDateString(),
          ])}
          headers={["Program", "Difficulty", "Duration", "Created"]}
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Recent invitations</h2>
        </div>
        <SimpleTable
          empty="No invitations yet."
          rows={(profile?.invitations ?? []).map((invite) => [
            invite.email,
            invite.status,
            new Date(invite.createdAt).toLocaleDateString(),
          ])}
          headers={["Email", "Status", "Created"]}
        />
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Info({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-800">{value}</p>
    </div>
  );
}

function SimpleTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  if (!rows.length) return <p className="px-5 py-8 text-sm text-slate-400">{empty}</p>;
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50/60">
        <tr>{headers.map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => <td key={j} className="px-5 py-3 text-slate-700">{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
