"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Copy, Loader2, X } from "lucide-react";
import { ApiError, createApiClient } from "../../../../../lib/api";

interface ClientOption {
  user: { id: string; email: string; firstName: string | null; lastName: string | null };
}

function fullName(u: ClientOption["user"]) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
}

export function DuplicateScheduleButton({
  scheduleId,
  scheduleName,
  sourceClientUserId,
}: {
  scheduleId: string;
  scheduleName: string;
  sourceClientUserId: string;
}) {
  const router = useRouter();
  const { getToken } = useAuth();

  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [name, setName] = useState(`Copy of ${scheduleName}`);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [clientUserId, setClientUserId] = useState(sourceClientUserId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingClients(true);
    (async () => {
      try {
        const token = await getToken();
        const api = createApiClient(token);
        const rows = await api.get<ClientOption[]>("/clients");
        if (!cancelled) setClients(rows);
      } catch {
        /* leave clients empty; same-client default still works */
      } finally {
        if (!cancelled) setLoadingClients(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, getToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const api = createApiClient(token);
      const created = await api.post<{ id: string }>(
        `/schedules/${scheduleId}/duplicate`,
        {
          startDate,
          name: name.trim() || undefined,
          clientUserId:
            clientUserId && clientUserId !== sourceClientUserId
              ? clientUserId
              : undefined,
        },
      );
      router.push(`/coach/schedules/${created.id}`);
    } catch (err: unknown) {
      setError(
        err instanceof ApiError ? err.message : "Failed to duplicate schedule",
      );
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <Copy className="h-4 w-4" />
        Duplicate
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Duplicate schedule
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Clones the calendar layout. Workout slots carry over;
                  completion state does not.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !submitting && setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  New name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  New start date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  disabled={submitting}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Day-to-day pattern is preserved; dates shift by the offset.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  For client
                </label>
                <select
                  value={clientUserId}
                  onChange={(e) => setClientUserId(e.target.value)}
                  disabled={submitting || loadingClients}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
                >
                  {loadingClients ? (
                    <option value={sourceClientUserId}>Loading…</option>
                  ) : clients.length === 0 ? (
                    <option value={sourceClientUserId}>
                      Same as original
                    </option>
                  ) : (
                    clients.map((c) => (
                      <option key={c.user.id} value={c.user.id}>
                        {fullName(c.user)}
                        {c.user.id === sourceClientUserId
                          ? " (same as original)"
                          : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Duplicating…
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Create duplicate
                    </>
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
