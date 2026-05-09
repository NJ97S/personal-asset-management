"use client";

import { useHotkeys } from "@/lib/hooks/use-hotkeys";

export function TransactionHotkeyListener() {
  useHotkeys({
    n: () => window.dispatchEvent(new Event("open-new-transaction")),
  });
  return null;
}
