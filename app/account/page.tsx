import { redirect } from "next/navigation";

// Customer account area has been removed from the public site.
export default function AccountPage() {
  redirect("/");
}
