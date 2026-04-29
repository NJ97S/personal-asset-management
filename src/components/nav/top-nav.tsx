"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

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
        "sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur safe-top",
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
        <h1 className="text-heading-m text-foreground">{title}</h1>
      ) : null}
      {right ? <div className="ml-auto flex items-center gap-1">{right}</div> : null}
    </header>
  );
}
