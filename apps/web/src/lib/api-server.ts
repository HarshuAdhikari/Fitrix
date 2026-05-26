import "server-only";
import { auth } from "@clerk/nextjs/server";
import { ApiError } from "./api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

async function getServerToken(): Promise<string | null> {
  try {
    const session = await auth();
    if (!session?.userId) return null;
    return await session.getToken();
  } catch (e) {
    console.error("getServerToken error:", e);
    return null;
  }
}

export async function apiFetchServer<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getServerToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.message ?? res.statusText);
  }

  const envelope = await res.json();
  return envelope.data as T;
}
