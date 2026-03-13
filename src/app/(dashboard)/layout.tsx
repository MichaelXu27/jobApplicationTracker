import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";

/**
 * Dashboard layout — server component.
 * Checks session; unauthenticated visitors are redirected to /login.
 * All (dashboard) routes automatically inherit this protection.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#eaecf3]">
      <Navbar user={session.user} />
      <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
