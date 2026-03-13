import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

/**
 * Root page — redirects to /dashboard if logged in, otherwise /login.
 */
export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
