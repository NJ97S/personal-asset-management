import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/nav/sidebar";
import { BottomNav } from "@/components/nav/bottom-nav";

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex min-h-dvh bg-surface">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-[calc(env(safe-area-inset-bottom)+4.5rem)] md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
