"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, CalendarDays } from "lucide-react";

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
import { createTransaction } from "@/lib/actions/transactions";

interface AccountOpt {
  id: string;
  name: string;
  type: string;
}

interface TransferFormProps {
  accounts: AccountOpt[];
  defaultFromAccountId?: string;
  onSuccess?: () => void;
}

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function TransferForm({
  accounts,
  defaultFromAccountId,
  onSuccess,
}: TransferFormProps) {
  const [amount, setAmount] = React.useState("");
  const [fromAccountId, setFromAccountId] = React.useState<string | undefined>(
    defaultFromAccountId ?? accounts[0]?.id
  );
  const [toAccountId, setToAccountId] = React.useState<string | undefined>(
    accounts.find((a) => a.id !== (defaultFromAccountId ?? accounts[0]?.id))?.id
  );
  const [occurredAt, setOccurredAt] = React.useState(todayLocal());
  const [memo, setMemo] = React.useState("");
  const [pending, startTransition] = useTransition();

  const sameAccount =
    fromAccountId && toAccountId && fromAccountId === toAccountId;

  function handleSubmit(formData: FormData) {
    formData.set("type", "transfer");
    if (fromAccountId) formData.set("fromAccountId", fromAccountId);
    if (toAccountId) formData.set("toAccountId", toAccountId);
    formData.set("occurredAt", new Date(occurredAt).toISOString());

    startTransition(async () => {
      const result = await createTransaction(formData);
      if (result.ok) {
        toast.success("이체를 기록했어요");
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.(10);
        }
        setAmount("");
        setMemo("");
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  const formattedAmount = amount
    ? new Intl.NumberFormat("ko-KR").format(Number(amount))
    : "0";

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="rounded-lg bg-muted/40 p-4">
        <div className="mb-1 text-body-s text-muted-foreground">금액</div>
        <div className="flex items-baseline gap-1 tabular text-foreground">
          <span className="text-amount-l">₩</span>
          <input
            name="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="decimal"
            pattern="[0-9]*"
            placeholder="0"
            aria-label="금액"
            className="w-full bg-transparent text-display-l font-extrabold tabular outline-none"
          />
        </div>
        {amount ? (
          <div className="mt-1 text-body-s text-muted-foreground tabular">
            {formattedAmount}원
          </div>
        ) : null}
      </div>

      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-1.5">
          <Label>보내는 계정</Label>
          <Select value={fromAccountId} onValueChange={setFromAccountId}>
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
        <ArrowRight
          className="hidden h-5 w-5 self-center text-muted-foreground sm:block"
          aria-hidden
        />
        <div className="space-y-1.5">
          <Label>받는 계정</Label>
          <Select value={toAccountId} onValueChange={setToAccountId}>
            <SelectTrigger className={cn(sameAccount && "ring-2 ring-danger")}>
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
      </div>
      {sameAccount ? (
        <p className="text-body-s text-danger">
          같은 계정 간 이체는 만들 수 없어요. 다른 계정을 골라 주세요.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tr-date">날짜·시각</Label>
          <div className="relative">
            <CalendarDays
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
              aria-hidden
            />
            <Input
              id="tr-date"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tr-memo">메모 (선택)</Label>
          <Input
            id="tr-memo"
            name="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예: 적금 이체"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={
          pending ||
          !amount ||
          !fromAccountId ||
          !toAccountId ||
          !!sameAccount
        }
        className="w-full"
      >
        {pending ? "기록하는 중..." : "이체 기록"}
      </Button>
    </form>
  );
}
