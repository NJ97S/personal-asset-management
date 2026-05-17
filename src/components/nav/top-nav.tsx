"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

interface TopNavProps {
  title?: string;
  back?: boolean | string;
  right?: React.ReactNode;
  className?: string;
}

export function TopNav({ title, back, right, className }: TopNavProps) {
  const router = useRouter();
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background px-4 safe-top",
        className
      )}
    >
      {back ? (
        typeof back === "string" ? (
          <Link
            href={back as never}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-muted"
            aria-label="뒤로"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => router.back()}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-muted"
            aria-label="뒤로"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )
      ) : null}
      {title ? (
        <h1 className="min-w-0 flex-1 truncate text-heading-m text-foreground">
          {title}
        </h1>
      ) : (
        <div className="min-w-0 flex-1" />
      )}
      <div className="flex shrink-0 items-center gap-1">
        {right}
        <ThemeToggle />
      </div>
    </header>
  );
}
