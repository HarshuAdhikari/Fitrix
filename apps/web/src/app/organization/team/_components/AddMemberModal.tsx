"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  CheckCircle2,
  ClipboardCopy,
  Loader2,
  KeyRound,
  UserPlus,
  X,
} from "lucide-react";
import { ApiError, createApiClient } from "../../../../lib/api";

interface CreatedMember {
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "COACH" | "CLIENT";
  organizationName: string;
  temporaryPassword: string;
}

interface AddMemberModalProps {
  onClose: () => void;
}

export function AddMemberModal({ onClose }: AddMemberModalProps) {
  const router = useRouter();
  const { getToken } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    role: "COACH" as "COACH" | "CLIENT",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedMember | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const token = await getToken();
      const api = createApiClient(token);
      const result = await api.post<CreatedMember>("/organizations/me/members", {
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        role: form.role,
      });
      setCreated(result);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create member");
    } finally {
      setSubmitting(false);
    }
  };

  const generatePassword = () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
    const password = Array.from(
      { length: 14 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");
    setForm((prev) => ({ ...prev, password }));
  };

  const copyCredentials = async () => {
    if (!created) return;
    const text = [
      `Welcome to ${created.organizationName}!`,
      ``,
      `Your login credentials:`,
      `  Email:    ${created.email}`,
      `  Password: ${created.temporaryPassword}`,
      ``,
      `Sign in at: ${window.location.origin}/sign-in`,
      `Please change your password after your first login.`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <UserPlus className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              Add team member
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {created ? (
          /* Success state — show credentials to share */
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-800">
                  Account created!
                </p>
                <p className="mt-0.5 text-sm text-emerald-700">
                  Share these credentials with{" "}
                  {[created.firstName, created.lastName]
                    .filter(Boolean)
                    .join(" ") || created.email}
                  .
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm space-y-2">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Role</span>
                <span className="font-semibold text-slate-900">
                  {created.role}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Email</span>
                <span className="font-semibold text-slate-900 break-all">
                  {created.email}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Password</span>
                <span className="font-semibold text-slate-900">
                  {created.temporaryPassword}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Ask them to change their password after their first sign-in.
            </p>

            <div className="flex gap-3">
              <button
                onClick={copyCredentials}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="h-4 w-4" />
                    Copy credentials
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Creation form */
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            <p className="text-sm text-slate-500">
              This creates a sign-in account under your organization. They'll use
              the email and password you set below to access their portal.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  First name
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={set("firstName")}
                  placeholder="Jane"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Last name
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={set("lastName")}
                  placeholder="Smith"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phone
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+977..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                placeholder="jane@yourgym.com"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Temporary password <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                minLength={8}
                value={form.password}
                onChange={set("password")}
                placeholder="Min. 8 characters"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={generatePassword}
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Generate password
              </button>
              <p className="mt-1 text-xs text-slate-400">
                You'll share this with them. They should change it after first
                login.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Role <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["COACH", "CLIENT"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, role: r }))}
                    className={[
                      "rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition",
                      form.role === r
                        ? r === "COACH"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                    ].join(" ")}
                  >
                    {r === "COACH" ? "🏋️ Coach" : "👤 Client"}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {form.role === "COACH"
                  ? "Coach: can train assigned clients and create programs. Admins manage client creation."
                  : "Client: can view their assigned program and log workouts."}
              </p>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
