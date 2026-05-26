"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Zap,
  ArrowRight,
  UserPlus,
  AlertCircle,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

interface TokenInfo {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";
  expiresAt: string;
  coachName: string;
}

type PageState =
  | { kind: "loading" }
  | { kind: "valid"; data: TokenInfo }
  | { kind: "accepted"; data: TokenInfo }
  | { kind: "expired"; data: TokenInfo }
  | { kind: "invalid"; message: string };

export default function ActivatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [state, setState] = useState<PageState>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid", message: "No invitation token found in the URL." });
      return;
    }

    let cancelled = false;
    fetch(`${API_BASE}/invitations/token/${token}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message ?? "Invitation not found");
        }
        const envelope = await res.json();
        return (envelope.data ?? envelope) as TokenInfo;
      })
      .then((data) => {
        if (cancelled) return;
        if (data.status === "ACCEPTED") {
          setState({ kind: "accepted", data });
        } else if (data.status === "EXPIRED" || data.status === "CANCELLED") {
          setState({ kind: "expired", data });
        } else {
          setState({ kind: "valid", data });
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ kind: "invalid", message: err.message });
      });

    return () => { cancelled = true; };
  }, [token]);

  const handleAccept = (data: TokenInfo) => {
    const params = new URLSearchParams({ email: data.email });
    router.push(`/sign-up?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-16">
      {/* Logo */}
      <Link href="/" className="mb-10 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-sm font-bold text-white shadow-md">
          F
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">FitRix</span>
      </Link>

      {/* ── Loading ── */}
      {state.kind === "loading" && (
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          <p className="text-sm">Checking your invitation…</p>
        </div>
      )}

      {/* ── Valid / PENDING ── */}
      {state.kind === "valid" && (
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
          {/* Header band */}
          <div className="bg-brand-gradient px-8 py-8 text-center text-white">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <UserPlus className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-white/80">You're invited by</p>
            <h1 className="mt-1 text-2xl font-extrabold">{state.data.coachName}</h1>
          </div>

          {/* Body */}
          <div className="px-8 py-7">
            {(state.data.firstName || state.data.lastName) && (
              <p className="mb-4 text-center text-sm text-slate-500">
                Hi{" "}
                <strong className="text-slate-800">
                  {[state.data.firstName, state.data.lastName].filter(Boolean).join(" ")}
                </strong>
                , this invite is for{" "}
                <span className="font-mono text-xs text-slate-600">{state.data.email}</span>
              </p>
            )}

            <p className="text-center text-slate-600 leading-relaxed">
              <strong>{state.data.coachName}</strong> is inviting you to train together
              on FitRix — a single place for your workouts, check-ins, and progress.
            </p>

            <div className="my-6 space-y-2.5">
              {[
                "Set up your account with one click",
                "Download the FitRix app on your phone",
                "Start your programme on day one",
              ].map((step, i) => (
                <div key={step} className="flex items-center gap-3 text-sm text-slate-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>

            <button
              onClick={() => handleAccept(state.data)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:-translate-y-0.5 hover:bg-brand-700"
            >
              Accept invitation
              <ArrowRight className="h-5 w-5" />
            </button>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              Expires{" "}
              {new Date(state.data.expiresAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-8 py-4 text-center text-xs text-slate-400">
            By accepting you agree to FitRix's{" "}
            <Link href="/" className="text-brand-600 hover:underline">Terms of Service</Link>
            .
          </div>
        </div>
      )}

      {/* ── Already accepted ── */}
      {state.kind === "accepted" && (
        <div className="w-full max-w-md rounded-3xl border border-green-200 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">You're already in!</h2>
          <p className="mt-3 text-slate-600">
            This invitation has already been accepted. Sign in to access your dashboard.
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* ── Expired / Cancelled ── */}
      {state.kind === "expired" && (
        <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {state.data.status === "CANCELLED" ? "Invitation cancelled" : "Invitation expired"}
          </h2>
          <p className="mt-3 text-slate-600">
            {state.data.status === "CANCELLED"
              ? "This invitation was cancelled by your coach. Ask them to send a new one."
              : "This invitation link has expired. Ask your coach to resend the invitation."}
          </p>
          <p className="mt-6 text-xs text-slate-400">
            Invited by <strong>{state.data.coachName}</strong>
          </p>
        </div>
      )}

      {/* ── Invalid token ── */}
      {state.kind === "invalid" && (
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Invitation not found</h2>
          <p className="mt-3 text-sm text-slate-600">{state.message}</p>
          <p className="mt-5 text-xs text-slate-400">
            Make sure you used the full link from the email. If the problem persists, ask your coach to resend the invitation.
          </p>
        </div>
      )}

      {/* Footer */}
      <p className="mt-10 flex items-center gap-1.5 text-xs text-slate-400">
        <Zap className="h-3.5 w-3.5" />
        Powered by FitRix — modern coaching software
      </p>
    </div>
  );
}
