"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Plus, Loader2, X } from "lucide-react";
import { ApiError, createApiClient } from "../../../../lib/api";

interface ClientOpt {
  id: string;
  name: string;
}

interface ScheduleCreated {
  id: string;
}

export function CreateScheduleButton({ clients }: { clients: ClientOpt[] }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    name: "",
    clientUserId: clients[0]?.id ?? "",
    startDate: today,
    endDate: "",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        clientUserId: form.clientUserId,
        startDate: form.startDate,
      };
      if (form.endDate) body.endDate = form.endDate;
      const created = await createApiClient(token).post<ScheduleCreated>(
        "/schedules",
        body,
      );
      setOpen(false);
      router.push(`/coach/schedules/${created.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to create schedule",
      );
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
      >
        <Plus className="h-4 w-4" />
        New schedule
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  New schedule
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Pick a client and a start date. You can fill the calendar
                  afterward.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">
                  Name <span className="text-red-500">*</span>
                </span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Q1 2026 Strength Block"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">
                  Client <span className="text-red-500">*</span>
                </span>
                <select
                  required
                  value={form.clientUserId}
                  onChange={(e) => update("clientUserId", e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Start <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => update("startDate", e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    End (optional)
                  </span>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => update("endDate", e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
