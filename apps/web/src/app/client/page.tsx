import { redirect } from "next/navigation";

export default function ClientRootRedirect() {
  redirect("/client/dashboard");
}
