import { redirect } from "next/navigation";

export default function ConnectedAccountsRedirectPage() {
  redirect("/settings/account/connections");
}
