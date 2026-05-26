"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { UserX } from "lucide-react";
import { createApiClient, ApiError } from "../../../../lib/api";

interface Props {
  coachId: string;
  coachName: string;
}

export function SuspendCoachButton({ coachId, coachName }: Props) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSuspend = async () => {
    if (
      !confirm(
        `Suspend ${coachName}? They will lose COACH access and be demoted to CLIENT.`,
      )
    )
      return;

    setLoading(true);
    try {
      const token = await getToken();
      const api = createApiClient(token);
      await api.patch(`/admin/coaches/${coachId}/suspend`, {});
      router.refresh();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to suspend coach");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={() => void handleSuspend()}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <UserX className="h-3.5 w-3.5" />
      {loading ? "Suspending…" : "Suspend"}
    </button>
  );
}
