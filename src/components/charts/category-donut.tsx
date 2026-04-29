"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { formatKRW } from "@/lib/utils";

export interface CategorySlice {
  id: string;
  name: string;
  amount: number;
  color: string;
}

interface CategoryDonutProps {
  data: CategorySlice[];
  total: number;
  height?: number;
}

const FALLBACK_PALETTE = [
  "hsl(var(--brand-green))",
  "hsl(var(--brand-blue))",
  "hsl(var(--brand-pink))",
  "hsl(var(--brand-cyan))",
  "hsl(var(--brand-amber))",
  "#7E57C2",
  "#9CA3AF",
];

export function CategoryDonut({ data, total, height = 260 }: CategoryDonutProps) {
  const display = data.filter((d) => d.amount > 0);

  if (display.length === 0 || total === 0) {
    return (
      <div
        className="flex items-center justify-center text-body-m text-muted-foreground"
        style={{ height }}
      >
        이번 달엔 아직 지출이 없어요.
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={display}
            dataKey="amount"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            stroke="none"
            paddingAngle={1.5}
          >
            {display.map((d, i) => (
              <Cell
                key={d.id}
                fill={d.color || FALLBACK_PALETTE[i % FALLBACK_PALETTE.length]}
              />
            ))}
          </Pie>
          <Tooltip
            cursor={{ fill: "transparent" }}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderRadius: 12,
              border: "1px solid hsl(var(--border))",
              fontSize: 13,
              padding: "8px 12px",
            }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            formatter={(value: number, name: string) => [
              formatKRW(value),
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-body-s text-muted-foreground">총 지출</span>
        <span className="tabular text-heading-l">{formatKRW(total)}</span>
      </div>
    </div>
  );
}

export function CategoryLegend({ data, total }: { data: CategorySlice[]; total: number }) {
  const sorted = [...data].sort((a, b) => b.amount - a.amount).filter((d) => d.amount > 0);
  if (total === 0) return null;
  return (
    <ul className="space-y-2">
      {sorted.map((d, i) => {
        const pct = (d.amount / total) * 100;
        return (
          <li
            key={d.id}
            className="flex items-center gap-3 rounded-md px-1 py-1"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: d.color || FALLBACK_PALETTE[i % FALLBACK_PALETTE.length],
              }}
            />
            <span className="flex-1 truncate text-body-m">{d.name}</span>
            <span className="text-body-s text-muted-foreground tabular w-10 text-right">
              {pct.toFixed(0)}%
            </span>
            <span className="tabular text-body-m">{formatKRW(d.amount)}</span>
          </li>
        );
      })}
    </ul>
  );
}
