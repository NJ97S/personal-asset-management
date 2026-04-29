"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { formatKRW } from "@/lib/utils";

export interface DailyPoint {
  /** ISO date YYYY-MM-DD */
  date: string;
  expense: number;
  income: number;
}

interface DailyBarProps {
  data: DailyPoint[];
  height?: number;
}

export function DailyBar({ data, height = 220 }: DailyBarProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            stroke="hsl(var(--border))"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => Number((v as string).slice(-2)).toString()}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => {
              const n = Number(v);
              if (n >= 10000) return `${Math.round(n / 10000)}만`;
              if (n >= 1000) return `${Math.round(n / 1000)}천`;
              return String(n);
            }}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
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
              name === "expense" ? "지출" : "수입",
            ]}
            labelFormatter={(v) => `${v}일`}
          />
          <Bar
            dataKey="expense"
            fill="hsl(var(--danger))"
            radius={[6, 6, 0, 0]}
            maxBarSize={20}
          />
          <Bar
            dataKey="income"
            fill="hsl(var(--brand-green))"
            radius={[6, 6, 0, 0]}
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
