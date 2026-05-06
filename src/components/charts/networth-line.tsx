"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { formatKRW } from "@/lib/utils";

export interface NetWorthSeriesPoint {
  month: string; // YYYY-MM
  assets: number;
  liabilities: number;
  netWorth: number;
}

interface Props {
  data: NetWorthSeriesPoint[];
  height?: number;
}

const compact = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000) return `${Math.round(n / 10_000)}만`;
  if (abs >= 1_000) return `${Math.round(n / 1_000)}천`;
  return String(n);
};

export function NetWorthLine({ data, height = 240 }: Props) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="nw-fill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(var(--brand-green))"
                stopOpacity={0.28}
              />
              <stop
                offset="95%"
                stopColor="hsl(var(--brand-green))"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="hsl(var(--border))"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tickFormatter={(v) => Number((v as string).slice(-2)).toString() + "월"}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => compact(Number(v))}
            width={48}
          />
          <Tooltip
            cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "3 3" }}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderRadius: 12,
              border: "1px solid hsl(var(--border))",
              fontSize: 13,
              padding: "8px 12px",
            }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            formatter={(value: number, name: string) => {
              const label =
                name === "netWorth"
                  ? "순자산"
                  : name === "assets"
                    ? "자산"
                    : "부채";
              return [formatKRW(value), label];
            }}
            labelFormatter={(v) => `${v}`}
          />
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke="hsl(var(--brand-green))"
            strokeWidth={2}
            fill="url(#nw-fill)"
          />
          <Area
            type="monotone"
            dataKey="assets"
            stroke="hsl(var(--brand-blue))"
            strokeWidth={1.5}
            fill="none"
            strokeDasharray="4 4"
          />
          <Area
            type="monotone"
            dataKey="liabilities"
            stroke="hsl(var(--danger))"
            strokeWidth={1.5}
            fill="none"
            strokeDasharray="4 4"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
