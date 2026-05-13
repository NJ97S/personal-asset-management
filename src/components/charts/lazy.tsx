"use client";

import dynamic from "next/dynamic";

const ChartSkeleton = ({ height }: { height: number }) => (
  <div
    className="w-full animate-pulse rounded-md bg-muted/50"
    style={{ height }}
    aria-hidden
  />
);

export const NetWorthLine = dynamic(
  () => import("./networth-line").then((m) => m.NetWorthLine),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={240} />,
  }
);

export const CategoryDonut = dynamic(
  () => import("./category-donut").then((m) => m.CategoryDonut),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={260} />,
  }
);

export const CategoryLegend = dynamic(
  () => import("./category-donut").then((m) => m.CategoryLegend),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={120} />,
  }
);

export const DailyBar = dynamic(
  () => import("./daily-bar").then((m) => m.DailyBar),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={220} />,
  }
);
