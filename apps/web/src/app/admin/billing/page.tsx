import { AlertCircle, CreditCard, Receipt, TrendingUp, AlertTriangle } from "lucide-react";
import { apiFetchServer } from "../../../lib/api-server";

export const dynamic = "force-dynamic";

interface UserRef {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface BillingOverview {
  totals: {
    paidCents: number;
    pendingCents: number;
    failedCents: number;
    activeSubscriptions: number;
    pastDueSubscriptions: number;
    cancelledSubscriptions: number;
  };
  payments: Array<{
    id: string;
    amountCents: number;
    currency: string;
    status: string;
    provider: string;
    providerRef: string | null;
    createdAt: string;
    client: UserRef;
  }>;
  invoices: Array<{
    id: string;
    number: string;
    totalCents: number;
    currency: string;
    issuedAt: string;
    pdfUrl: string | null;
    client: UserRef;
  }>;
}

function money(cents: number, currency = "NPR") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function nameOf(user: UserRef) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminBillingPage() {
  let billing: BillingOverview | null = null;
  let error: string | null = null;

  try {
    billing = await apiFetchServer<BillingOverview>("/admin/billing");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load billing";
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-violet-600">Admin console</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Billing
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Revenue, subscriptions, payments, and recent invoices.
        </p>
      </header>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : null}

      {billing ? (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Metric icon={TrendingUp} label="Paid revenue" value={money(billing.totals.paidCents)} />
            <Metric icon={CreditCard} label="Pending" value={money(billing.totals.pendingCents)} />
            <Metric icon={AlertTriangle} label="Failed" value={money(billing.totals.failedCents)} />
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Metric icon={CreditCard} label="Active subscriptions" value={billing.totals.activeSubscriptions.toLocaleString()} />
            <Metric icon={AlertTriangle} label="Past due" value={billing.totals.pastDueSubscriptions.toLocaleString()} />
            <Metric icon={Receipt} label="Cancelled" value={billing.totals.cancelledSubscriptions.toLocaleString()} />
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Panel title="Recent payments">
              <Rows empty="No payments yet.">
                {billing.payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{nameOf(p.client)}</p>
                      <p className="text-xs text-slate-500">{p.client.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{money(p.amountCents, p.currency)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </Rows>
            </Panel>

            <Panel title="Recent invoices">
              <Rows empty="No invoices yet.">
                {billing.invoices.map((i) => (
                  <tr key={i.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{i.number}</p>
                      <p className="text-xs text-slate-500">{nameOf(i.client)}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{money(i.totalCents, i.currency)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(i.issuedAt)}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">{i.pdfUrl ? "PDF" : "-"}</td>
                  </tr>
                ))}
              </Rows>
            </Panel>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof CreditCard; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Rows({ children, empty }: { children: React.ReactNode; empty: string }) {
  const rows = Array.isArray(children) ? children.filter(Boolean) : children;
  return (
    <table className="w-full text-sm">
      <tbody>
        {Array.isArray(rows) && rows.length === 0 ? (
          <tr>
            <td className="px-5 py-10 text-center text-sm text-slate-400">{empty}</td>
          </tr>
        ) : (
          rows
        )}
      </tbody>
    </table>
  );
}
