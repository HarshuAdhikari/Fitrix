"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Plus,
  Search,
  Users,
  AlertCircle,
  X,
  Trash2,
  Eye,
  Mail,
  Clock,
  CheckCircle2,
  Send,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { createApiClient, ApiError } from "../../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClientRow {
  assignmentId: string;
  status: string;
  startedAt: string;
  clientProfileId: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  goals: string[];
  heightCm: number | null;
  weightKg: number | null;
}

interface InvitationRow {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";
  expiresAt: string;
  createdAt: string;
  activationUrl?: string;
}

interface Props {
  initialClients: ClientRow[];
  initialError: string | null;
  canInviteClients: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clientDisplayName(c: ClientRow): string {
  return (
    [c.user.firstName, c.user.lastName].filter(Boolean).join(" ") ||
    c.user.email ||
    "Unnamed"
  );
}

function inviteDisplayName(i: InvitationRow): string {
  return (
    [i.firstName, i.lastName].filter(Boolean).join(" ") || i.email
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function daysUntil(iso: string): number {
  return Math.ceil(
    (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ClientsView({
  initialClients,
  initialError,
  canInviteClients,
}: Props) {
  const router = useRouter();
  const { getToken } = useAuth();

  const [clients, setClients] = useState<ClientRow[]>(initialClients);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(canInviteClients);

  const [pageError, setPageError] = useState<string | null>(initialError);
  const [modalOpen, setModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [latestActivationUrl, setLatestActivationUrl] = useState<string | null>(null);

  // Load pending invitations + active clients, with polling and tab-focus
  // refresh so the list updates when an invited client accepts. No websockets:
  // 30s polling + immediate refresh on visibility change is plenty for the
  // low-frequency "client accepted" event and keeps infra simple.
  useEffect(() => {
    let cancelled = false;
    let firstLoad = true;

    const refresh = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const token = await getToken();
        const api = createApiClient(token);
        const [clientRows, inviteRows] = await Promise.all([
          api.get<ClientRow[]>("/clients").catch(() => null),
          canInviteClients
            ? api.get<InvitationRow[]>("/invitations").catch(() => null)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        if (clientRows) setClients(clientRows);
        if (inviteRows)
          setInvitations(inviteRows.filter((i) => i.status === "PENDING"));
      } finally {
        if (!cancelled && firstLoad) {
          firstLoad = false;
          setInvitesLoading(false);
        }
      }
    };

    void refresh();
    const intervalId = window.setInterval(() => void refresh(), 30_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [canInviteClients, getToken]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const hay = [clientDisplayName(c), c.user.email, ...c.goals]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [clients, search]);

  const filteredInvites = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invitations;
    return invitations.filter((i) =>
      [inviteDisplayName(i), i.email].join(" ").toLowerCase().includes(q),
    );
  }, [invitations, search]);

  const handleRemove = async (row: ClientRow) => {
    if (!confirm(`Remove ${clientDisplayName(row)} from your roster?`)) return;
    setRemovingId(row.assignmentId);
    setPageError(null);
    try {
      const token = await getToken();
      await createApiClient(token).delete(`/clients/${row.user.id}`);
      setClients((prev) => prev.filter((c) => c.assignmentId !== row.assignmentId));
    } catch (e) {
      setPageError(e instanceof ApiError ? e.message : "Failed to remove client");
    } finally {
      setRemovingId(null);
    }
  };

  const handleCancelInvite = async (inv: InvitationRow) => {
    if (!confirm(`Cancel the invitation for ${inviteDisplayName(inv)}?`)) return;
    setCancellingId(inv.id);
    try {
      const token = await getToken();
      await createApiClient(token).patch(`/invitations/${inv.id}/cancel`, {});
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
    } catch (e) {
      setPageError(e instanceof ApiError ? e.message : "Failed to cancel invitation");
    } finally {
      setCancellingId(null);
    }
  };

  const handleInviteSent = (inv: InvitationRow) => {
    setInvitations((prev) => [inv, ...prev]);
    setModalOpen(false);
    setSuccessMsg(`Invitation sent to ${inv.email}`);
    setLatestActivationUrl(inv.activationUrl ?? null);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const copyActivationUrl = async (url = latestActivationUrl) => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setSuccessMsg("Activation link copied");
  };

  const totalCount = clients.length + invitations.length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clients</h1>
          <p className="mt-1 text-slate-500">
            {clients.length} active · {invitations.length} pending invite
            {invitations.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canInviteClients ? (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Add client
          </button>
        ) : null}
      </header>

      {/* ── Error banner ── */}
      {pageError ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Something went wrong</p>
            <p className="mt-0.5 text-sm text-red-700">{pageError}</p>
          </div>
          <button onClick={() => setPageError(null)} className="text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* ── Success banner ── */}
      {successMsg ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            <p className="flex-1 text-sm font-medium text-green-800">{successMsg}</p>
            <button onClick={() => setSuccessMsg(null)} className="text-green-400 hover:text-green-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          {latestActivationUrl ? (
            <div className="mt-3 flex flex-col gap-2 rounded-lg border border-green-200 bg-white/70 p-3 sm:flex-row sm:items-center">
              <input
                readOnly
                value={latestActivationUrl}
                className="min-w-0 flex-1 rounded-md border border-green-100 bg-white px-3 py-2 text-xs text-slate-700"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void copyActivationUrl()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-green-200 bg-white px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
                <Link
                  href={latestActivationUrl}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      ) : latestActivationUrl ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <p className="flex-1 truncate text-sm font-medium text-green-800">
            Activation link available: {latestActivationUrl}
          </p>
          <button
            type="button"
            onClick={() => void copyActivationUrl()}
            className="inline-flex items-center gap-1.5 rounded-md border border-green-200 bg-white px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
          <button onClick={() => setLatestActivationUrl(null)} className="text-green-400 hover:text-green-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or goal..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-card focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      {/* ── Empty state ── */}
      {totalCount === 0 && !invitesLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Users className="h-6 w-6" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-900">No clients yet</p>
          <p className="mt-1 text-sm text-slate-500">
            {canInviteClients
              ? "Send your first invitation to start building your roster."
              : "Your organization admin assigns clients to your roster."}
          </p>
          {canInviteClients ? (
            <button
              onClick={() => setModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Add client
            </button>
          ) : null}
        </div>
      ) : null}

      {/* ── Active clients table ── */}
      {filteredClients.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="border-b border-slate-100 px-6 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active clients · {clients.length}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Client</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Goals</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((c) => {
                  const name = clientDisplayName(c);
                  return (
                    <tr key={c.assignmentId} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <Link href={`/coach/clients/${c.user.id}`} className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-semibold text-white shadow-sm">
                            {initials(name)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 hover:text-brand-700">{name}</span>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              <span className="text-xs text-slate-400">Active</span>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{c.user.email}</td>
                      <td className="px-6 py-4">
                        {c.goals.length === 0 ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {c.goals.slice(0, 2).map((g) => (
                              <span key={g} className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                                {g}
                              </span>
                            ))}
                            {c.goals.length > 2 ? (
                              <span className="text-xs text-slate-500">+{c.goals.length - 2}</span>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/coach/clients/${c.user.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-700"
                            title="View profile"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {canInviteClients ? (
                            <button
                              onClick={() => void handleRemove(c)}
                              disabled={removingId === c.assignmentId}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              title="Remove"
                            >
                              {removingId === c.assignmentId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : clients.length > 0 && search ? (
        <p className="py-4 text-center text-sm text-slate-500">No active clients match your search.</p>
      ) : null}

      {/* ── Pending invitations section ── */}
      {invitesLoading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading invitations…
        </div>
      ) : filteredInvites.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="border-b border-slate-100 px-6 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending invitations · {invitations.length}
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredInvites.map((inv) => {
              const name = inviteDisplayName(inv);
              const days = daysUntil(inv.expiresAt);
              const expiringSoon = days <= 2;
              return (
                <div key={inv.id} className="flex items-center gap-4 px-6 py-4">
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-xs font-semibold text-slate-500">
                    {initials(name) || <Mail className="h-4 w-4" />}
                  </div>

                  {/* Name + email */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{name}</p>
                    <p className="truncate text-xs text-slate-500">{inv.email}</p>
                  </div>

                  {/* Status badge */}
                  <div className="hidden items-center gap-1.5 sm:flex">
                    <span className={[
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      expiringSoon
                        ? "bg-amber-50 text-amber-700"
                        : "bg-blue-50 text-blue-700",
                    ].join(" ")}>
                      <Clock className="h-3 w-3" />
                      {days > 0 ? `Expires in ${days}d` : "Expires today"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {inv.activationUrl ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void copyActivationUrl(inv.activationUrl)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-green-50 hover:text-green-600"
                          title="Copy activation link"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <Link
                          href={inv.activationUrl}
                          target="_blank"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          title="Open activation link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </>
                    ) : null}
                    <button
                      onClick={() => void handleCancelInvite(inv)}
                      disabled={cancellingId === inv.id}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Cancel invitation"
                    >
                      {cancellingId === inv.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 px-6 py-3">
            <p className="text-xs text-slate-400">
              Invitations expire after 7 days. The client will appear in your active list once they accept and create their account.
            </p>
          </div>
        </div>
      ) : invitations.length > 0 && search ? (
        <p className="py-2 text-center text-sm text-slate-500">No pending invitations match your search.</p>
      ) : null}

      {/* ── Invite modal ── */}
      {modalOpen && canInviteClients ? (
        <InviteClientModal
          onClose={() => setModalOpen(false)}
          onInviteSent={handleInviteSent}
        />
      ) : null}
    </div>
  );
}

// ─── Invite modal ─────────────────────────────────────────────────────────────

interface Program {
  id: string;
  name: string;
  durationWeeks: number;
  difficulty: string;
}

interface PaginatedPrograms {
  data: Program[];
}

interface InviteModalProps {
  onClose: () => void;
  onInviteSent: (inv: InvitationRow) => void;
}

function InviteClientModal({ onClose, onInviteSent }: InviteModalProps) {
  const { getToken } = useAuth();

  // Form fields
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [programId, setProgramId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [durationWeeks, setDurationWeeks] = useState<number | "">("");
  const [videoCallingEnabled, setVideoCallingEnabled] = useState(false);

  // UI state
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch coach's programs for the dropdown
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const response = await createApiClient(token).get<Program[] | PaginatedPrograms>("/programs");
        const data = Array.isArray(response) ? response : response.data;
        if (!cancelled) setPrograms(data ?? []);
      } catch {
        // Non-fatal — dropdown just stays empty
      } finally {
        if (!cancelled) setProgramsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [getToken]);

  // When a plan is selected, auto-fill duration from the plan's durationWeeks
  const handleProgramChange = (id: string) => {
    setProgramId(id);
    if (id) {
      const prog = programs.find((p) => p.id === id);
      if (prog) setDurationWeeks(prog.durationWeeks);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const inv = await createApiClient(token).post<InvitationRow>(
        "/invitations",
        {
          email: email.trim().toLowerCase(),
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          programId: programId || undefined,
          startDate: startDate || undefined,
          durationWeeks: durationWeeks !== "" ? Number(durationWeeks) : undefined,
          videoCallingEnabled,
        },
      );
      onInviteSent(inv);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send invitation");
      setSubmitting(false);
    }
  };

  const inputCls =
    "h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add new client</h2>
            <p className="mt-1 text-sm text-slate-500">
              They'll receive an activation email with a link to set up their account.
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
          <div className="space-y-5 px-6 py-5">

            {/* ── Section: Client details ── */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Client details
              </p>
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    required
                    placeholder="client@example.com"
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">First name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Alex"
                      maxLength={60}
                      className={inputCls}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Last name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Morgan"
                      maxLength={60}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-slate-100" />

            {/* ── Section: Program (optional) ── */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Program assignment{" "}
                <span className="normal-case font-normal text-slate-400">— optional</span>
              </p>
              <div className="space-y-3">
                {/* Plan dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Assign a plan</label>
                  <select
                    value={programId}
                    onChange={(e) => handleProgramChange(e.target.value)}
                    disabled={programsLoading}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
                  >
                    <option value="">
                      {programsLoading ? "Loading plans…" : programs.length === 0 ? "No plans yet — create one first" : "No plan — assign later"}
                    </option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.durationWeeks}w · {p.difficulty.toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start date + Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Start date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className={inputCls}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Duration (weeks)</label>
                    <input
                      type="number"
                      value={durationWeeks}
                      onChange={(e) =>
                        setDurationWeeks(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      min={1}
                      max={52}
                      placeholder="e.g. 12"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-slate-100" />

            {/* ── Section: Video calling toggle ── */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Enable video calling</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Allow 1-on-1 video sessions with this client
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVideoCallingEnabled((v) => !v)}
                className={[
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
                  videoCallingEnabled ? "bg-brand-600" : "bg-slate-200",
                ].join(" ")}
                role="switch"
                aria-checked={videoCallingEnabled}
              >
                <span
                  className={[
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200",
                    videoCallingEnabled ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>

            {/* ── What happens next ── */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                What happens next
              </p>
              <ol className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">1</span>
                  Client receives an activation email from FitRix
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">2</span>
                  They set up their account and download the app
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">3</span>
                  They appear on your active roster — ready for programming
                </li>
              </ol>
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            ) : null}
          </div>

          {/* ── Sticky footer ── */}
          <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !email.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
