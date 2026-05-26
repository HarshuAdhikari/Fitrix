import { apiFetchServer } from "../../../lib/api-server";
import { ClientsView, type ClientRow } from "./_components/ClientsView";

export const dynamic = "force-dynamic";

interface CurrentUser {
  organizationId: string | null;
}

export default async function ClientsPage() {
  let clients: ClientRow[] = [];
  let error: string | null = null;
  let canInviteClients = false;

  try {
    const [rows, me] = await Promise.all([
      apiFetchServer<ClientRow[]>("/clients"),
      apiFetchServer<CurrentUser>("/users/me"),
    ]);
    clients = rows;
    canInviteClients = !me.organizationId;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load clients";
  }

  return (
    <ClientsView
      initialClients={clients}
      initialError={error}
      canInviteClients={canInviteClients}
    />
  );
}
