import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Globe, Mail, MapPin, Phone } from "lucide-react";
import { apiFetchServer } from "../../../../lib/api-server";
import { OrganizationDetailActions } from "../_components/OrganizationDetailActions";

export const dynamic = "force-dynamic";

type OrganizationType = "GYM_OR_CHAIN" | "INDIVIDUAL_COACH";

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
  contactEmail: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  notes: string | null;
  owner: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    role: string;
  } | null;
  userCount: number;
  adminCount: number;
  coachCount: number;
  clientCount: number;
  programCount: number;
  createdAt: string;
}

function displayName(user: Organization["owner"]) {
  if (!user) return "No owner";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

function compactAddress(org: Organization) {
  return [
    org.addressLine1,
    org.addressLine2,
    org.city,
    org.state,
    org.postalCode,
    org.country,
  ].filter(Boolean).join(", ");
}

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let organization: Organization;
  try {
    organization = await apiFetchServer<Organization>(`/organizations/${id}`);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/organizations" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to organizations
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-violet-600">
            {organization.type === "GYM_OR_CHAIN" ? "Gym / large fitness chain" : "Individual coach workspace"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {organization.name}
          </h1>
          <p className="mt-1 font-mono text-sm text-slate-500">{organization.slug}</p>
        </div>
        <OrganizationDetailActions organization={organization} />
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Users" value={organization.userCount} />
        <Metric label="Clients" value={organization.clientCount} />
        <Metric label="Coaches" value={organization.coachCount} />
        <Metric label="Programs" value={organization.programCount} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="font-semibold text-slate-900">Contact information</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Info icon={Mail} label="Email" value={organization.contactEmail ?? "-"} />
            <Info icon={Phone} label="Phone" value={organization.phone ?? "-"} />
            <Info icon={Globe} label="Website" value={organization.website ?? "-"} />
            <Info icon={MapPin} label="Address" value={compactAddress(organization) || "-"} />
          </div>
          <Info label="Notes" value={organization.notes ?? "-"} className="mt-5" />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Building2 className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-semibold text-slate-900">Owner</h2>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {displayName(organization.owner)}
          </p>
          {organization.owner ? (
            <div className="mt-3 space-y-1 text-sm text-slate-500">
              <p>{organization.owner.email}</p>
              <p>{organization.owner.phone ?? "-"}</p>
              <p className="font-mono text-xs">{organization.owner.role}</p>
            </div>
          ) : null}
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="font-semibold text-slate-900">Workspace category</h2>
        <p className="mt-2 text-sm text-slate-600">
          {organization.type === "GYM_OR_CHAIN"
            ? "This customer is managed as a gym owner or larger fitness chain with organization-scoped admins, coaches, and clients."
            : "This customer is managed as an individual coach workspace with manually provisioned access."}
        </p>
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

function Info({
  label,
  value,
  className = "",
  icon: Icon,
}: {
  label: string;
  value: string;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className={className}>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-slate-800">{value}</p>
    </div>
  );
}
