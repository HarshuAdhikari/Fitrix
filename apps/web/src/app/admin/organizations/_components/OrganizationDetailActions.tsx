"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { ApiError, createApiClient } from "../../../../lib/api";

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
}

const INPUT =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

export function OrganizationDetailActions({ organization }: { organization: Organization }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: organization.name,
    slug: organization.slug,
    type: organization.type,
    contactEmail: organization.contactEmail ?? "",
    phone: organization.phone ?? "",
    website: organization.website ?? "",
    addressLine1: organization.addressLine1 ?? "",
    addressLine2: organization.addressLine2 ?? "",
    city: organization.city ?? "",
    state: organization.state ?? "",
    postalCode: organization.postalCode ?? "",
    country: organization.country ?? "",
    notes: organization.notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      await createApiClient(token).patch(`/organizations/${organization.id}`, {
        name: form.name.trim(),
        slug: form.slug.trim(),
        type: form.type,
        contactEmail: form.contactEmail.trim() || null,
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
        addressLine1: form.addressLine1.trim() || null,
        addressLine2: form.addressLine2.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        postalCode: form.postalCode.trim() || null,
        country: form.country.trim() || null,
        notes: form.notes.trim() || null,
      });
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update organization");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete ${organization.name}? This disables the organization and its users.`)) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      await createApiClient(token).delete(`/organizations/${organization.id}`);
      router.push("/admin/organizations");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to delete organization");
      setSubmitting(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <Pencil className="h-4 w-4" />
          Edit
        </button>
        <button onClick={remove} disabled={submitting} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Edit organization</h2>
        <button type="button" onClick={() => setEditing(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Name"><input value={form.name} onChange={(e) => update("name", e.target.value)} className={INPUT} required /></Field>
        <Field label="Slug"><input value={form.slug} onChange={(e) => update("slug", e.target.value)} className={INPUT} /></Field>
        <Field label="Category">
          <select value={form.type} onChange={(e) => update("type", e.target.value as OrganizationType)} className={INPUT}>
            <option value="GYM_OR_CHAIN">Gym / large fitness chain</option>
            <option value="INDIVIDUAL_COACH">Individual coach workspace</option>
          </select>
        </Field>
        <Field label="Contact email"><input type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} className={INPUT} /></Field>
        <Field label="Phone"><input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={INPUT} /></Field>
        <Field label="Website"><input type="url" value={form.website} onChange={(e) => update("website", e.target.value)} className={INPUT} /></Field>
        <Field label="Address line 1"><input value={form.addressLine1} onChange={(e) => update("addressLine1", e.target.value)} className={INPUT} /></Field>
        <Field label="Address line 2"><input value={form.addressLine2} onChange={(e) => update("addressLine2", e.target.value)} className={INPUT} /></Field>
        <Field label="City"><input value={form.city} onChange={(e) => update("city", e.target.value)} className={INPUT} /></Field>
        <Field label="Country"><input value={form.country} onChange={(e) => update("country", e.target.value)} className={INPUT} /></Field>
      </div>
      <Field label="Notes"><textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></Field>
      {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <div className="mt-5 flex justify-end">
        <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
          <Save className="h-4 w-4" />
          {submitting ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
