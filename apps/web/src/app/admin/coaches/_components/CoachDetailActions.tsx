"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Check, Copy, KeyRound, Pencil, Save, Trash2, X } from "lucide-react";
import { ApiError, createApiClient } from "../../../../lib/api";

interface Coach {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  coachProfile: {
    bio: string | null;
    specialties: string[];
    yearsOfExperience: number | null;
    timezone: string | null;
  } | null;
}

const INPUT =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

export function CoachDetailActions({ coach }: { coach: Coach }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    email: coach.email,
    firstName: coach.firstName ?? "",
    lastName: coach.lastName ?? "",
    phone: coach.phone ?? "",
    bio: coach.coachProfile?.bio ?? "",
    specialties: coach.coachProfile?.specialties.join(", ") ?? "",
    yearsOfExperience: coach.coachProfile?.yearsOfExperience?.toString() ?? "",
    timezone: coach.coachProfile?.timezone ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset password state
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const api = createApiClient(token);

      // If email changed, update it separately
      if (form.email.trim().toLowerCase() !== coach.email.toLowerCase()) {
        await api.patch(`/admin/coaches/${coach.id}/email`, {
          email: form.email.trim(),
        });
      }

      await api.patch(`/admin/coaches/${coach.id}`, {
        firstName: form.firstName.trim() || null,
        lastName: form.lastName.trim() || null,
        phone: form.phone.trim() || null,
        bio: form.bio.trim() || null,
        specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
        yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : null,
        timezone: form.timezone.trim() || null,
      });

      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update coach");
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async () => {
    if (!confirm("Generate a new temporary password for this coach?")) return;
    setResetting(true);
    setError(null);
    try {
      const token = await getToken();
      const result = await createApiClient(token).post<{ temporaryPassword: string }>(
        `/admin/coaches/${coach.id}/reset-password`,
        {},
      );
      setTempPassword(result.temporaryPassword);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const copyPassword = async () => {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const remove = async () => {
    if (!confirm("Delete this coach account? The account will be disabled.")) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      await createApiClient(token).delete(`/admin/coaches/${coach.id}`);
      router.push("/admin/coaches");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to delete coach");
      setSubmitting(false);
    }
  };

  if (!editing) {
    return (
      <div className="space-y-3">
        {/* Temporary password reveal */}
        {tempPassword ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-semibold text-emerald-800">New temporary password</p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 rounded bg-white px-2 py-1 font-mono text-sm text-emerald-900 border border-emerald-200">
                {tempPassword}
              </code>
              <button
                onClick={copyPassword}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-emerald-700">
              Share this with the coach. They should change it after logging in.
            </p>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={resetPassword}
            disabled={resetting}
            className="inline-flex items-center gap-2 rounded-lg border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-600 hover:bg-violet-50 disabled:opacity-60"
          >
            <KeyRound className="h-4 w-4" />
            {resetting ? "Generating…" : "Reset password"}
          </button>
          <button
            onClick={remove}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      </div>
    );
  }

  return (
    <form onSubmit={save} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Edit coach</h2>
        <button type="button" onClick={() => setEditing(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Email" className="md:col-span-2">
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className={INPUT}
          />
          {form.email.trim().toLowerCase() !== coach.email.toLowerCase() && (
            <p className="mt-1 text-xs text-amber-600">
              This updates the email in FitRix. The coach must use the new email to sign in.
            </p>
          )}
        </Field>
        <Field label="First name"><input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className={INPUT} /></Field>
        <Field label="Last name"><input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className={INPUT} /></Field>
        <Field label="Phone"><input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={INPUT} /></Field>
        <Field label="Timezone"><input value={form.timezone} onChange={(e) => update("timezone", e.target.value)} className={INPUT} /></Field>
        <Field label="Experience"><input type="number" min={0} value={form.yearsOfExperience} onChange={(e) => update("yearsOfExperience", e.target.value)} className={INPUT} /></Field>
        <Field label="Specialties"><input value={form.specialties} onChange={(e) => update("specialties", e.target.value)} className={INPUT} /></Field>
      </div>
      <Field label="Bio"><textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={4} className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></Field>
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

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
