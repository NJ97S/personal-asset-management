"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";

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
import { upsertHolding } from "@/lib/actions/holdings";

const ASSET_CLASSES = [
  { value: "stock_kr", label: "한국 주식" },
  { value: "stock_us", label: "미국 주식" },
  { value: "etf", label: "ETF" },
  { value: "fund", label: "펀드" },
  { value: "crypto", label: "암호화폐" },
  { value: "other", label: "기타 (수동)" },
] as const;

type AssetClass = (typeof ASSET_CLASSES)[number]["value"];

interface AccountOpt {
  id: string;
  name: string;
  type: string;
}

interface HoldingFormProps {
  accounts: AccountOpt[];
  initial?: {
    id?: string;
    accountId?: string;
    ticker?: string;
    name?: string | null;
    exchange?: string | null;
    assetClass?: AssetClass;
    quantity?: number;
    avgBuyPrice?: number;
    manualValue?: number | null;
  };
  onSuccess?: () => void;
}

export function HoldingForm({ accounts, initial, onSuccess }: HoldingFormProps) {
  const [accountId, setAccountId] = React.useState<string | undefined>(
    initial?.accountId ?? accounts[0]?.id
  );
  const [ticker, setTicker] = React.useState(initial?.ticker ?? "");
  const [name, setName] = React.useState(initial?.name ?? "");
  const [assetClass, setAssetClass] = React.useState<AssetClass>(
    initial?.assetClass ?? "stock_kr"
  );
  const [quantity, setQuantity] = React.useState(
    initial?.quantity != null ? String(initial.quantity) : ""
  );
  const [avgBuyPrice, setAvgBuyPrice] = React.useState(
    initial?.avgBuyPrice != null ? String(initial.avgBuyPrice) : ""
  );
  const [manualValue, setManualValue] = React.useState(
    initial?.manualValue != null ? String(initial.manualValue) : ""
  );
  const [pending, startTransition] = useTransition();

  const isManual = assetClass === "other";

  function handleSubmit(formData: FormData) {
    if (initial?.id) formData.set("id", initial.id);
    if (accountId) formData.set("accountId", accountId);
    formData.set("ticker", ticker);
    formData.set("name", name);
    formData.set("assetClass", assetClass);
    formData.set("quantity", quantity || "0");
    formData.set("avgBuyPrice", avgBuyPrice || "0");
    formData.set("manualValue", isManual ? manualValue : "");

    startTransition(async () => {
      const result = await upsertHolding(formData);
      if (result.ok) {
        toast.success(initial?.id ? "수정했어요" : "종목을 추가했어요");
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>계정</Label>
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
        <Label>유형</Label>
        <Select
          value={assetClass}
          onValueChange={(v) => setAssetClass(v as AssetClass)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSET_CLASSES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="hd-ticker">종목코드</Label>
          <Input
            id="hd-ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.trim())}
            placeholder="예: 005930 / AAPL / BTC"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hd-name">이름 (선택)</Label>
          <Input
            id="hd-name"
            value={name ?? ""}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 삼성전자 / Apple"
          />
        </div>
      </div>

      {!isManual && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hd-qty">수량</Label>
            <Input
              id="hd-qty"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="tabular"
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hd-avg">평균 매입가</Label>
            <Input
              id="hd-avg"
              inputMode="decimal"
              value={avgBuyPrice}
              onChange={(e) => setAvgBuyPrice(e.target.value)}
              className="tabular"
              placeholder="0"
            />
          </div>
        </div>
      )}

      {isManual && (
        <div className="space-y-1.5">
          <Label htmlFor="hd-manual">평가 금액 (수동 입력)</Label>
          <Input
            id="hd-manual"
            inputMode="decimal"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            className="tabular"
            placeholder="예: 부동산·기타 자산"
          />
          <p className="text-caption text-muted-foreground">
            가격이 자동으로 갱신되지 않는 자산은 직접 평가금액을 입력해 주세요.
          </p>
        </div>
      )}

      <Button
        type="submit"
        disabled={pending || !ticker || !accountId}
        className="w-full"
      >
        {pending ? "저장하는 중..." : initial?.id ? "수정" : "추가"}
      </Button>
    </form>
  );
}
