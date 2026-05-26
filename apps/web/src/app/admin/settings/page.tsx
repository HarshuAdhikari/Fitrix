import { AlertCircle, CheckCircle2, XCircle, Settings } from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";

export const dynamic = "force-dynamic";

interface SettingsResponse {
  environment: string;
  appUrl: string;
  apiPort: number;
  email: {
    provider: string;
    configured: boolean;
    fromEmail: string;
  };
  auth: {
    provider: string;
    configured: boolean;
    webhooksConfigured: boolean;
  };
  database: {
    configured: boolean;
  };
}

export default async function AdminSettingsPage() {
  let settings: SettingsResponse | null = null;
  let error: string | null = null;

  try {
    settings = await apiFetchServer<SettingsResponse>("/admin/settings");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load settings";
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-violet-600">Admin console</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Current platform configuration status.
        </p>
      </header>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : null}

      {settings ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Runtime">
            <Field label="Environment" value={settings.environment} />
            <Field label="App URL" value={settings.appUrl} />
            <Field label="API port" value={String(settings.apiPort)} />
          </Card>

          <Card title="Email">
            <Status label={`${settings.email.provider} configured`} ok={settings.email.configured} />
            <Field label="From email" value={settings.email.fromEmail} />
          </Card>

          <Card title="Authentication">
            <Status label={`${settings.auth.provider} keys configured`} ok={settings.auth.configured} />
            <Status label="Webhook secret configured" ok={settings.auth.webhooksConfigured} />
          </Card>

          <Card title="Database">
            <Status label="Database URL configured" ok={settings.database.configured} />
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
          <Settings className="h-4 w-4" />
        </div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="truncate text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

function Status({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
        {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
        {ok ? "Ready" : "Missing"}
      </span>
    </div>
  );
}
