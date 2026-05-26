const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(
  path: string,
  token: string | null,
  init?: RequestInit,
): Promise<T> {
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

export function createApiClient(token: string | null) {
  return {
    get<T>(path: string) {
      return apiFetch<T>(path, token);
    },
    post<T>(path: string, body: unknown) {
      return apiFetch<T>(path, token, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    patch<T>(path: string, body: unknown) {
      return apiFetch<T>(path, token, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    put<T>(path: string, body: unknown) {
      return apiFetch<T>(path, token, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    delete<T>(path: string) {
      return apiFetch<T>(path, token, { method: "DELETE" });
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
