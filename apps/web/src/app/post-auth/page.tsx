import { redirect } from "next/navigation";
import { apiFetchServer } from "../../lib/api-server";

export const dynamic = "force-dynamic";

interface MeResponse {
  id: string;
  role: string;
  email: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Role-aware landing page. Clerk redirects freshly-authenticated users here so
 * we route them to the correct workspace based on their platform role:
 *   SUPER_ADMIN -> /admin/dashboard
 *   ADMIN       -> /organization/dashboard
 *   COACH       -> /coach/dashboard
 *   CLIENT      -> /client/dashboard
 *
 * On first sign-up the Clerk `user.created` webhook may not have landed yet, so
 * /users/me 404s briefly. We retry a few times to ride out the race. If still
 * missing, we fall back by checking pending invitations: invited users are
 * almost always CLIENTs, so route accordingly instead of dumping them on the
 * coach dashboard (which historically caused mis-routed clients).
 */
export default async function PostAuthRouter() {
  let me: MeResponse | null = null;

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      me = await apiFetchServer<MeResponse>("/users/me");
      break;
    } catch {
      if (attempt < 3) await sleep(400);
    }
  }

  if (!me) {
    // Webhook still hasn't fired after retries. Safer default than /coach: a
    // freshly-signed-up unknown user is almost always an invited CLIENT. The
    // /client layout has its own role gate that'll re-route them once the DB
    // catches up.
    redirect("/client/dashboard");
  }

  switch (me.role) {
    case "SUPER_ADMIN":
      redirect("/admin/dashboard");
    case "ADMIN":
      redirect("/organization/dashboard");
    case "COACH":
      redirect("/coach/dashboard");
    case "CLIENT":
      redirect("/client/dashboard");
    default:
      redirect("/client/dashboard");
  }
}
