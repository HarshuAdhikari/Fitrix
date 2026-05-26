"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Loader2, Plus, X } from "lucide-react";
import { ApiError, createApiClient } from "../../../../lib/api";

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export function CreateProgramButton() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    difficulty: "BEGINNER" as Difficulty,
    durationWeeks: "4",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const reset = () => {
    setForm({ name: "", description: "", difficulty: "BEGINNER", durationWeeks: "4" });
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        difficulty: form.difficulty,
        durationWeeks: Number(form.durationWeeks) || 4,
      };
      if (form.description.trim()) {
        body.description = form.description.trim();
      }
      await createApiClient(token).post<{ id: string }>("/programs", body);
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create program");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
      >
        <Plus className="h-4 w-4" /> New program
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => {
            setOpen(false);
            reset();
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">New program</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  A program is a multi-week training plan you can assign to clients.
                </p>
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <Field label="Program name" required>
                <input
                  autoFocus
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. 12-week Hypertrophy"
                  className={INPUT_CLS}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Difficulty">
                  <select
                    value={form.difficulty}
                    onChange={(e) =>
                      update("difficulty", e.target.value as Difficulty)
                    }
                    className={INPUT_CLS}
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </Field>
                <Field label="Duration (weeks)">
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.durationWeeks}
                    onChange={(e) => update("durationWeeks", e.target.value)}
                    className={INPUT_CLS}
                  />
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={3}
                  placeholder="What this program is for, who it's aimed at, anything you want coaches and clients to know."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </Field>

              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.name.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                    </>
                  ) : (
                    "Create program"
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

const INPUT_CLS =
  "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
