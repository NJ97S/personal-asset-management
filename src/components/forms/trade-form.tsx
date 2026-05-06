"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatKRW } from "@/lib/utils";
import { createTransaction } from "@/lib/actions/transactions";

interface AccountOpt {
  id: string;
  name: string;
  type: string;
}

interface TradeFormProps {
  accounts: AccountOpt[];
  defaultAccountId?: string;
  onSuccess?: () => void;
}

type TradeKind = "buy" | "sell";

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

const num = (v: string) => Number(v.replace(/,/g, "")) || 0;

export function TradeForm({
  accounts,
  defaultAccountId,
  onSuccess,
}: TradeFormProps) {
  const [tradeKind, setTradeKind] = React.useState<TradeKind>("buy");
  const [accountId, setAccountId] = React.useState<string | undefined>(
    defaultAccountId ?? accounts[0]?.id
  );
  const [ticker, setTicker] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [pricePerUnit, setPricePerUnit] = React.useState("");
  const [fee, setFee] = React.useState("");
  const [occurredAt, setOccurredAt] = React.useState(todayLocal());
  const [memo, setMemo] = React.useState("");
  const [pending, startTransition] = useTransition();

  const totalAmount = num(quantity) * num(pricePerUnit) + num(fee);

  function handleSubmit(formData: FormData) {
    formData.set("type", "trade");
    formData.set("tradeKind", tradeKind);
    if (accountId) formData.set("accountId", accountId);
    formData.set("ticker", ticker.trim().toUpperCase());
    formData.set("quantity", quantity || "0");
    formData.set("pricePerUnit", pricePerUnit || "0");
    formData.set("fee", fee || "0");
    formData.set("amount", String(totalAmount));
    formData.set("occurredAt", new Date(occurredAt).toISOString());

    startTransition(async () => {
      const result = await createTransaction(formData);
      if (result.ok) {
        toast.success(tradeKind === "buy" ? "매수를 기록했어요" : "매도를 기록했어요");
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.(10);
        }
        setQuantity("");
        setPricePerUnit("");
        setFee("");
        setMemo("");
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  const accentClass = tradeKind === "buy" ? "text-danger" : "text-success";

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { value: "buy", label: "매수" },
            { value: "sell", label: "매도" },
          ] as const
        ).map((k) => (
          <button
            key={k.value}
            type="button"
            onClick={() => setTradeKind(k.value)}
            className={cn(
              "h-10 rounded-md text-body-l font-bold transition-colors",
              tradeKind === k.value
                ? k.value === "buy"
                  ? "bg-danger/10 text-danger ring-2 ring-danger"
                  : "bg-success/10 text-success ring-2 ring-success"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
            aria-pressed={tradeKind === k.value}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-muted/40 p-4">
        <div className="mb-1 text-body-s text-muted-foreground">
          {tradeKind === "buy" ? "매수 금액" : "매도 금액"} (수량 × 단가 + 수수료)
        </div>
        <div className={cn("flex items-baseline gap-1 tabular", accentClass)}>
          <span className="text-amount-l">₩</span>
          <span className="text-display-l font-extrabold">
            {formatKRW(totalAmount).replace("₩", "")}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>현금 계정</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="계정 선택" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="td-ticker">종목코드</Label>
          <Input
            id="td-ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="예: 005930 / AAPL / BTC"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="td-qty">수량</Label>
          <Input
            id="td-qty"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="tabular"
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="td-price">단가</Label>
          <Input
            id="td-price"
            inputMode="decimal"
            value={pricePerUnit}
            onChange={(e) => setPricePerUnit(e.target.value)}
            className="tabular"
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="td-fee">수수료</Label>
          <Input
            id="td-fee"
            inputMode="decimal"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="tabular"
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="td-date">날짜·시각</Label>
          <div className="relative">
            <CalendarDays
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
              aria-hidden
            />
            <Input
              id="td-date"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="td-memo">메모 (선택)</Label>
          <Input
            id="td-memo"
            name="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예: 분할매수 1차"
          />
        </div>
      </div>

      <p className="text-caption text-muted-foreground">
        보유 종목 수량/평균가는 자동으로 갱신되지 않아요. 설정 → 보유 종목에서 별도로 관리해 주세요.
      </p>

      <Button
        type="submit"
        disabled={
          pending ||
          !ticker ||
          !accountId ||
          num(quantity) <= 0 ||
          num(pricePerUnit) <= 0
        }
        className="w-full"
      >
        {pending
          ? "기록하는 중..."
          : tradeKind === "buy"
            ? "매수 기록"
            : "매도 기록"}
      </Button>
    </form>
  );
}
