"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Trash2 } from "lucide-react";
import { createApiClient, ApiError } from "../../../../../lib/api";

interface Props {
  clientUserId: string;
  clientName: string;
}

export function ClientDetailActions({ clientUserId, clientName }: Props) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`Remove ${clientName} from your roster?`)) return;

    setRemoving(true);
    try {
      const token = await getToken();
      const api = createApiClient(token);
      await api.delete(`/clients/${clientUserId}`);
      router.push("/coach/clients");
      router.refresh();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to remove client");
      setRemoving(false);
    }
  };

  return (
    <button
      onClick={() => void handleRemove()}
      disabled={removing}
      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 className="h-4 w-4" />
      {removing ? "Removing..." : "Remove from roster"}
    </button>
  );
}
