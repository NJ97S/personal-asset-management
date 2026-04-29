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
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto w-full max-w-[720px] md:max-w-[1120px]">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
