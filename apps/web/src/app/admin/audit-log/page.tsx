import { AlertCircle, ClipboardList } from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";

export const dynamic = "force-dynamic";

interface AuditEvent {
  id: string;
  type: string;
  title: string;
  detail: string;
  occurredAt: string;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminAuditLogPage() {
  let events: AuditEvent[] = [];
  let error: string | null = null;

  try {
    events = await apiFetchServer<AuditEvent[]>("/admin/audit-log");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load audit log";
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-violet-600">Admin console</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Audit log
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Recent platform activity assembled from existing records.
        </p>
      </header>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="divide-y divide-slate-100">
          {events.map((event) => (
            <div key={event.id} className="flex gap-4 px-6 py-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-semibold text-slate-900">{event.title}</p>
                  <p className="text-xs text-slate-400">{formatDate(event.occurredAt)}</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">{event.detail}</p>
                <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {event.type}
                </span>
              </div>
            </div>
          ))}
          {events.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">
              No activity found.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
