"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/domain/category-icon";
import { ResponsiveSheet } from "./responsive-sheet";
import { HoldingForm } from "./holding-form";
import { deleteHolding, refreshHoldingPrices } from "@/lib/actions/holdings";
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
  const [refreshing, startRefresh] = useTransition();

  const hasFetchableHoldings = holdings.some(
    (h) => h.assetClass !== "other" && !(h.manualValue != null && h.manualValue > 0)
  );

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

  function refresh() {
    startRefresh(async () => {
      const result = await refreshHoldingPrices();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const { ok: okCount, failed } = result.data;
      if (failed === 0 && okCount > 0) {
        toast.success(`${okCount}종목 시세를 갱신했어요`);
      } else if (okCount > 0) {
        toast.warning(`${okCount}종목 갱신, ${failed}종목 실패`);
      } else if (failed > 0) {
        toast.error(`${failed}종목 시세 갱신에 실패했어요`);
      } else {
        toast.info("갱신할 종목이 없어요");
      }
    });
  }

  const accountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name ?? "?";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-body-s text-muted-foreground">
          {holdings.length}종목
        </p>
        <div className="flex items-center gap-2">
          {hasFetchableHoldings && (
            <Button
              size="sm"
              variant="outline"
              onClick={refresh}
              disabled={refreshing}
              aria-label="시세 새로고침"
            >
              <RefreshCw
                className={cn("h-4 w-4", refreshing && "animate-spin")}
              />
              <span className="hidden sm:inline">시세 갱신</span>
            </Button>
          )}
          <Button size="sm" onClick={startNew} disabled={accounts.length === 0}>
            <Plus className="h-4 w-4" /> 추가
          </Button>
        </div>
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
              const quantityLabel =
                h.assetClass !== "other"
                  ? `수량 ${new Intl.NumberFormat("ko-KR", {
                      maximumFractionDigits: 8,
                    }).format(h.quantity)}`
                  : null;
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
              const needsQuantity =
                h.assetClass !== "other" && h.quantity <= 0;
              const updatedLabel =
                h.latestPriceDate != null
                  ? formatDistanceToNow(new Date(h.latestPriceDate), {
                      addSuffix: true,
                      locale: ko,
                    })
                  : null;

              const detailParts = [
                assetLabelMap[h.assetClass],
                accountName(h.accountId),
                quantityLabel,
                avgPriceLabel,
                currentPriceLabel,
              ].filter(Boolean) as string[];

              return (
                <li key={h.id} className="px-4 py-3">
                  {/*
                    모바일 폭에서 한 행에 icon + 텍스트 + 가격 + 편집/삭제 5단을 욱여넣으면
                    중간 텍스트 cell 이 ~40px 만 남아 "TIGER 미국..." 처럼 잘린다.
                    구조를 2층으로 나누고 (헤더 행 + 액션 행) 본문은 자유롭게 wrap 한다.
                  */}
                  <div className="flex items-start gap-3">
                    <CategoryIcon
                      icon={assetIconMap[h.assetClass]}
                      color={assetColorMap[h.assetClass]}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="min-w-0 flex-1 break-keep text-body-l font-medium"
                          style={{ wordBreak: "keep-all" }}
                        >
                          {h.name ? `${h.name} · ${h.ticker}` : h.ticker}
                        </p>
                        <div className="shrink-0 text-right">
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
                      </div>
                      <p
                        className="mt-1 text-body-s text-muted-foreground"
                        style={{ wordBreak: "keep-all" }}
                      >
                        {detailParts.join(" · ")}
                      </p>
                      {needsQuantity && (
                        <p className="mt-1 text-caption text-danger">
                          수량이 0이에요. 편집해서 보유 수량을 입력해 주세요.
                        </p>
                      )}
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="text-body-xs text-muted-foreground/60">
                          {updatedLabel ? `${updatedLabel} 갱신` : "시세 미갱신"}
                        </p>
                        <div className="flex items-center">
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
                        </div>
                      </div>
                    </div>
                  </div>
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
