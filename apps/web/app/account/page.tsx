import { redirect } from "next/navigation";

export default function AccountPageRedirect() {
  redirect("/profile");
}
