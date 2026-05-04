import { Sidebar } from "@/components/nav/sidebar";
import { BottomNav } from "@/components/nav/bottom-nav";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-surface">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
