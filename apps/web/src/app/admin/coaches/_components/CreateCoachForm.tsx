"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, ClipboardCopy, KeyRound, UserCheck } from "lucide-react";
import { ApiError, createApiClient } from "../../../../lib/api";

interface CoachResult {
  id: string;
  email: string;
  temporaryPassword?: string;
}

const EMPTY_FORM = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  bio: "",
  specialties: "",
  yearsOfExperience: "",
  timezone: "Asia/Kathmandu",
};

const INPUT =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  return Array.from(
    { length: 14 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
}

function splitSpecialties(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function CreateCoachForm() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [created, setCreated] = useState<CoachResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const result = await createApiClient(token).post<CoachResult>("/admin/coaches", {
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        bio: form.bio.trim() || undefined,
        specialties: splitSpecialties(form.specialties),
        yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
        timezone: form.timezone.trim() || undefined,
      });
      setCreated(result);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to create coach");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = async () => {
    if (!created?.temporaryPassword) return;
    await navigator.clipboard.writeText(
      [
        "FitRix coach access",
        `Email: ${created.email}`,
        `Password: ${created.temporaryPassword}`,
        `Sign in: ${window.location.origin}/sign-in`,
      ].join("\n"),
    );
  };

  return (
    <div className="max-w-3xl">
      <Link href="/admin/coaches" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to coaches
      </Link>

      <form onSubmit={submit} className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Coach account</h2>
            <p className="text-sm text-slate-500">Create login credentials and profile details.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="First name"><input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className={INPUT} /></Field>
          <Field label="Last name"><input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className={INPUT} /></Field>
          <Field label="Email" required><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={INPUT} required /></Field>
          <Field label="Phone"><input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={INPUT} /></Field>
          <Field label="Temporary password" required>
            <div className="flex gap-2">
              <input value={form.password} onChange={(e) => update("password", e.target.value)} className={INPUT} required minLength={8} />
              <button type="button" onClick={() => update("password", generatePassword())} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <KeyRound className="h-3.5 w-3.5" />
                Generate
              </button>
            </div>
          </Field>
          <Field label="Timezone"><input value={form.timezone} onChange={(e) => update("timezone", e.target.value)} className={INPUT} /></Field>
          <Field label="Years of experience"><input type="number" min={0} value={form.yearsOfExperience} onChange={(e) => update("yearsOfExperience", e.target.value)} className={INPUT} /></Field>
          <Field label="Specialties"><input value={form.specialties} onChange={(e) => update("specialties", e.target.value)} className={INPUT} placeholder="Strength, Mobility" /></Field>
        </div>

        <Field label="Bio">
          <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={4} className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
        </Field>

        {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        {created?.temporaryPassword ? (
          <button type="button" onClick={copyCredentials} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            <ClipboardCopy className="h-4 w-4" />
            Copy credentials
          </button>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button type="submit" disabled={submitting} className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
            {submitting ? "Creating..." : "Create coach"}
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
