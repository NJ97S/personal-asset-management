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
import { cn } from "@/lib/utils";
import { upsertAccount } from "@/lib/actions/accounts";

const ACCOUNT_TYPES = [
  { value: "cash", label: "현금" },
  { value: "bank", label: "은행" },
  { value: "credit_card", label: "카드" },
  { value: "stock", label: "증권" },
  { value: "crypto", label: "암호화폐" },
  { value: "real_estate", label: "부동산" },
  { value: "loan", label: "대출" },
  { value: "other", label: "기타" },
] as const;

const COLOR_OPTIONS = [
  "#00CD80",
  "#0099FF",
  "#00CDCD",
  "#F582C6",
  "#F79009",
  "#F04438",
  "#7E57C2",
  "#9CA3AF",
] as const;

const CURRENCIES = ["KRW", "USD", "EUR", "JPY"];

interface AccountFormProps {
  initial?: {
    id?: string;
    name?: string;
    type?: (typeof ACCOUNT_TYPES)[number]["value"];
    currency?: string;
    initialBalance?: number;
    color?: string | null;
    sortOrder?: number;
  };
  onSuccess?: () => void;
}

export function AccountForm({ initial, onSuccess }: AccountFormProps) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [type, setType] = React.useState<(typeof ACCOUNT_TYPES)[number]["value"]>(
    initial?.type ?? "bank"
  );
  const [currency, setCurrency] = React.useState(initial?.currency ?? "KRW");
  const [initialBalance, setInitialBalance] = React.useState(
    initial?.initialBalance != null ? String(initial.initialBalance) : "0"
  );
  const [color, setColor] = React.useState<string>(initial?.color ?? "#0099FF");
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    if (initial?.id) formData.set("id", initial.id);
    formData.set("name", name);
    formData.set("type", type);
    formData.set("currency", currency);
    formData.set(
      "initialBalance",
      String(Number(initialBalance.replace(/[^\d.-]/g, "") || 0))
    );
    formData.set("color", color);
    formData.set("sortOrder", String(initial?.sortOrder ?? 0));

    startTransition(async () => {
      const result = await upsertAccount(formData);
      if (result.ok) {
        toast.success(initial?.id ? "수정했어요" : "계정을 추가했어요");
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="acc-name">이름</Label>
        <Input
          id="acc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 신한 주거래"
          required
          maxLength={40}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>종류</Label>
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>통화</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="acc-balance">초기 잔액</Label>
        <Input
          id="acc-balance"
          inputMode="decimal"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
          className="tabular"
        />
        <p className="text-caption text-muted-foreground">
          이 잔액 이전의 거래는 계산에 포함되지 않아요. 비워두면 0원으로 시작.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>색</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              aria-pressed={c === color}
              className={cn(
                "h-9 w-9 rounded-full transition-transform",
                c === color ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <Button type="submit" disabled={pending || !name} className="w-full">
        {pending ? "저장하는 중..." : initial?.id ? "수정" : "추가"}
      </Button>
    </form>
  );
}
