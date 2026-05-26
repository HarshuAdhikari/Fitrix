"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Building2, ClipboardCopy, KeyRound } from "lucide-react";
import { ApiError, createApiClient } from "../../../../lib/api";

type OrganizationType = "GYM_OR_CHAIN" | "INDIVIDUAL_COACH";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface OrganizationResult {
  id: string;
  name: string;
  ownerTemporaryPassword?: string;
  owner: { email: string } | null;
}

const EMPTY_FORM = {
  name: "",
  slug: "",
  type: "GYM_OR_CHAIN" as OrganizationType,
  contactEmail: "",
  phone: "",
  website: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  notes: "",
  ownerMode: "new" as "new" | "existing" | "none",
  ownerUserId: "",
  ownerEmail: "",
  ownerPassword: "",
  ownerFirstName: "",
  ownerLastName: "",
  ownerPhone: "",
};

const INPUT =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

function displayName(user: User) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  return Array.from(
    { length: 14 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
}

export function CreateOrganizationForm({ ownerCandidates }: { ownerCandidates: User[] }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [created, setCreated] = useState<OrganizationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const payload = () => ({
    name: form.name.trim(),
    slug: form.slug.trim() || undefined,
    type: form.type,
    contactEmail: form.contactEmail.trim() || undefined,
    phone: form.phone.trim() || undefined,
    website: form.website.trim() || undefined,
    addressLine1: form.addressLine1.trim() || undefined,
    addressLine2: form.addressLine2.trim() || undefined,
    city: form.city.trim() || undefined,
    state: form.state.trim() || undefined,
    postalCode: form.postalCode.trim() || undefined,
    country: form.country.trim() || undefined,
    notes: form.notes.trim() || undefined,
    ...(form.ownerMode === "new"
      ? {
          ownerEmail: form.ownerEmail.trim(),
          ownerPassword: form.ownerPassword,
          ownerFirstName: form.ownerFirstName.trim() || undefined,
          ownerLastName: form.ownerLastName.trim() || undefined,
          ownerPhone: form.ownerPhone.trim() || undefined,
        }
      : form.ownerMode === "existing"
        ? { ownerUserId: form.ownerUserId || undefined }
        : {}),
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const result = await createApiClient(token).post<OrganizationResult>(
        "/organizations",
        payload(),
      );
      setCreated(result);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to create organization");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = async () => {
    if (!created?.ownerTemporaryPassword || !created.owner) return;
    await navigator.clipboard.writeText(
      [
        "FitRix organization access",
        `Organization: ${created.name}`,
        `Email: ${created.owner.email}`,
        `Password: ${created.ownerTemporaryPassword}`,
        `Sign in: ${window.location.origin}/sign-in`,
      ].join("\n"),
    );
  };

  return (
    <div className="max-w-4xl">
      <Link href="/admin/organizations" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to organizations
      </Link>

      <form onSubmit={submit} className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Customer workspace</h2>
            <p className="text-sm text-slate-500">Business profile, contact information, and owner credentials.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Customer name" required><input value={form.name} onChange={(e) => update("name", e.target.value)} className={INPUT} required minLength={2} /></Field>
          <Field label="Slug"><input value={form.slug} onChange={(e) => update("slug", e.target.value)} className={INPUT} /></Field>
          <Field label="Category">
            <select value={form.type} onChange={(e) => update("type", e.target.value)} className={INPUT}>
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
          <Field label="State / region"><input value={form.state} onChange={(e) => update("state", e.target.value)} className={INPUT} /></Field>
          <Field label="Postal code"><input value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} className={INPUT} /></Field>
          <Field label="Country"><input value={form.country} onChange={(e) => update("country", e.target.value)} className={INPUT} /></Field>
        </div>

        <Field label="Notes">
          <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
        </Field>

        <div className="mt-6 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
          <p className="text-sm font-semibold text-slate-900">Owner access</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["new", "existing", "none"] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => update("ownerMode", mode)} className={[
                "rounded-lg border px-3 py-2 text-xs font-semibold",
                form.ownerMode === mode ? "border-violet-500 bg-white text-violet-700" : "border-transparent text-slate-500 hover:bg-white/70",
              ].join(" ")}>
                {mode === "new" ? "New owner" : mode === "existing" ? "Existing user" : "No owner"}
              </button>
            ))}
          </div>

          {form.ownerMode === "new" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Owner first name"><input value={form.ownerFirstName} onChange={(e) => update("ownerFirstName", e.target.value)} className={INPUT} /></Field>
              <Field label="Owner last name"><input value={form.ownerLastName} onChange={(e) => update("ownerLastName", e.target.value)} className={INPUT} /></Field>
              <Field label="Owner email" required><input type="email" value={form.ownerEmail} onChange={(e) => update("ownerEmail", e.target.value)} className={INPUT} required /></Field>
              <Field label="Owner phone"><input value={form.ownerPhone} onChange={(e) => update("ownerPhone", e.target.value)} className={INPUT} /></Field>
              <Field label="Temporary password" required>
                <div className="flex gap-2">
                  <input value={form.ownerPassword} onChange={(e) => update("ownerPassword", e.target.value)} className={INPUT} required minLength={8} />
                  <button type="button" onClick={() => update("ownerPassword", generatePassword())} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <KeyRound className="h-3.5 w-3.5" />
                    Generate
                  </button>
                </div>
              </Field>
            </div>
          ) : form.ownerMode === "existing" ? (
            <Field label="Owner">
              <select value={form.ownerUserId} onChange={(e) => update("ownerUserId", e.target.value)} className={`${INPUT} mt-4`}>
                <option value="">Select existing user</option>
                {ownerCandidates.map((user) => (
                  <option key={user.id} value={user.id}>{displayName(user)} - {user.role}</option>
                ))}
              </select>
            </Field>
          ) : null}
        </div>

        {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {created?.ownerTemporaryPassword ? (
          <button type="button" onClick={copyCredentials} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            <ClipboardCopy className="h-4 w-4" />
            Copy owner credentials
          </button>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button type="submit" disabled={submitting} className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
            {submitting ? "Creating..." : "Create organization"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">
        {label}{required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
