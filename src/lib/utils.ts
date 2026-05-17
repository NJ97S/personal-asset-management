import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKRW(amount: number | string, opts?: { sign?: boolean }) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return "₩0";
  const abs = Math.abs(n);
  const formatted = new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(abs);
  if (opts?.sign) {
    if (n > 0) return `+₩${formatted}`;
    if (n < 0) return `-₩${formatted}`;
  }
  return n < 0 ? `-₩${formatted}` : `₩${formatted}`;
}

export function formatDateKo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(d);
}

export function formatMonthDay(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Seoul",
  }).format(d);
}

export function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(d);
}
