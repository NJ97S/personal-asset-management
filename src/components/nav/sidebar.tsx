"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Receipt,
  Wallet,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const items: Item[] = [
  { href: "/", label: "홈", icon: Home },
  { href: "/transactions", label: "가계부", icon: Receipt },
  { href: "/accounts", label: "자산", icon: Wallet },
  { href: "/settings", label: "설정", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:border-border md:bg-card md:px-4 md:py-6">
      <Link href="/" className="mb-6 px-2 text-heading-l text-foreground">
        내 자산
      </Link>
      <nav aria-label="주요 메뉴">
        <ul className="flex flex-col gap-1">
          {items.map((it) => {
            const active =
              it.href === "/"
                ? pathname === "/"
                : pathname.startsWith(it.href);
            const Icon = it.icon;
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-md px-3 text-body-l transition-colors",
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
