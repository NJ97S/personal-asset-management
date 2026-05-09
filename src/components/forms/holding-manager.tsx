"use client";

import * as React from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/domain/category-icon";
import { ResponsiveSheet } from "./responsive-sheet";
import { HoldingForm } from "./holding-form";
import { deleteHolding } from "@/lib/actions/holdings";
import { cn } from "@/lib/utils";

type AssetClass =
  | "stock_kr"
  | "stock_us"
  | "etf"
  | "fund"
  | "crypto"
  | "other";

type Holding = {
  id: string;
  accountId: string;
  ticker: string;
  name: string | null;
  exchange: string | null;
  assetClass: AssetClass;
  quantity: number;
  avgBuyPrice: number;
  manualValue: number | null;
  latestClose: number | null;
  latestPriceDate: string | null;
  marketValue: number;
  pnl: number | null;
  pnlPercent: number | null;
  currency: string;
};

interface HoldingManagerProps {
  holdings: Holding[];
  accounts: { id: string; name: string; type: string }[];
}

const assetIconMap: Record<string, string> = {
  stock_kr: "TrendingUp",
  stock_us: "Globe",
  etf: "BarChart3",
  fund: "PieChart",
  crypto: "Bitcoin",
  other: "Coins",
};

const assetLabelMap: Record<string, string> = {
  stock_kr: "한국 주식",
  stock_us: "미국 주식",
  etf: "ETF",
  fund: "펀드",
  crypto: "암호화폐",
  other: "기타",
};

const assetColorMap: Record<string, string> = {
  stock_kr: "#0099FF",
  stock_us: "#7E57C2",
  etf: "#00CDCD",
  fund: "#F582C6",
  crypto: "#F79009",
  other: "#9CA3AF",
};

function formatCurrency(amount: number, currency: string): string {
  if (currency === "USD") {
    const abs = Math.abs(amount);
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(abs);
    return amount < 0 ? `-$${formatted}` : `$${formatted}`;
  }
  // KRW and fallback
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(abs);
  return amount < 0 ? `-₩${formatted}` : `₩${formatted}`;
}

export function HoldingManager({ holdings, accounts }: HoldingManagerProps) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Holding | undefined>();
  const [, startTransition] = useTransition();

  function startNew() {
    setEditing(undefined);
    setOpen(true);
  }

  function startEdit(h: Holding) {
    setEditing(h);
    setOpen(true);
  }

  function remove(h: Holding) {
    if (
      !confirm(
        `${h.ticker}${h.name ? ` (${h.name})` : ""} 보유 기록을 삭제할까요? 거래 내역은 그대로 남아요.`
      )
    )
      return;
    startTransition(async () => {
      const result = await deleteHolding(h.id);
      if (result.ok) toast.success("삭제했어요");
      else toast.error(result.error);
    });
  }

  const accountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name ?? "?";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-body-s text-muted-foreground">
          {holdings.length}종목
        </p>
        <Button size="sm" onClick={startNew} disabled={accounts.length === 0}>
          <Plus className="h-4 w-4" /> 추가
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <p className="py-4 text-center text-body-m text-muted-foreground">
            먼저 계정을 추가해야 종목을 등록할 수 있어요.
          </p>
        </Card>
      ) : holdings.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-body-m text-muted-foreground">
            아직 등록한 종목이 없어요. 우측 상단 추가 버튼으로 시작해 보세요.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-border">
            {holdings.map((h) => {
              const avgPriceLabel =
                h.assetClass !== "other"
                  ? `평균 ${formatCurrency(h.avgBuyPrice, h.currency)}`
                  : null;
              const currentPriceLabel =
                h.latestClose != null
                  ? `현재 ${formatCurrency(h.latestClose, h.currency)}`
                  : h.manualValue != null
                  ? null
                  : "현재가 —";
              const updatedLabel =
                h.latestPriceDate != null
                  ? formatDistanceToNow(new Date(h.latestPriceDate), {
                      addSuffix: true,
                      locale: ko,
                    })
                  : null;

              return (
                <li key={h.id} className="flex items-center gap-3 px-4 py-3">
                  <CategoryIcon
                    icon={assetIconMap[h.assetClass]}
                    color={assetColorMap[h.assetClass]}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-l font-medium">
                      {h.name ? `${h.name} · ${h.ticker}` : h.ticker}
                    </p>
                    <p className="text-body-s text-muted-foreground">
                      {assetLabelMap[h.assetClass]} · {accountName(h.accountId)}
                      {avgPriceLabel ? ` · ${avgPriceLabel}` : ""}
                      {currentPriceLabel ? ` · ${currentPriceLabel}` : ""}
                    </p>
                    {updatedLabel && (
                      <p className="text-body-xs text-muted-foreground/60">
                        {updatedLabel} 갱신
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="tabular text-amount-m">
                      {formatCurrency(h.marketValue, h.currency)}
                    </div>
                    {h.pnlPercent != null && (
                      <div
                        className={cn(
                          "text-body-s tabular",
                          h.pnlPercent > 0
                            ? "text-success"
                            : h.pnlPercent < 0
                            ? "text-danger"
                            : "text-muted-foreground"
                        )}
                      >
                        {h.pnlPercent > 0 ? "+" : ""}
                        {h.pnlPercent.toFixed(2)}%
                      </div>
                    )}
                  </div>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => startEdit(h)}
                    aria-label="편집"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => remove(h)}
                    aria-label="삭제"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title={editing ? "종목 편집" : "새 종목"}
      >
        <HoldingForm
          accounts={accounts}
          initial={
            editing
              ? {
                  id: editing.id,
                  accountId: editing.accountId,
                  ticker: editing.ticker,
                  name: editing.name,
                  exchange: editing.exchange,
                  assetClass: editing.assetClass,
                  quantity: editing.quantity,
                  avgBuyPrice: editing.avgBuyPrice,
                  manualValue: editing.manualValue,
                }
              : undefined
          }
          onSuccess={() => setOpen(false)}
        />
      </ResponsiveSheet>
    </div>
  );
}
