"use client";

import { useEffect, useState } from "react";

function readMatches(query: string): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(query).matches;
}

export function useMediaQuery(query: string): boolean {
  // Sync initial evaluation prevents a desktop user from briefly seeing the
  // mobile branch (Drawer) before the effect flips isDesktop to true, which
  // caused vaul + radix portals to co-exist for a frame and render the
  // dialog content twice.
  const [matches, setMatches] = useState(() => readMatches(query));

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
