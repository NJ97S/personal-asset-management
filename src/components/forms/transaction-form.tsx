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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CategoryIcon } from "@/components/domain/category-icon";
import { cn } from "@/lib/utils";
import {
  createTransaction,
  updateTransaction,
} from "@/lib/actions/transactions";

type TxType = "expense" | "income";

interface CategoryOpt {
  id: string;
  name: string;
  kind: "income" | "expense";
  icon?: string | null;
  color?: string | null;
}
interface AccountOpt {
  id: string;
  name: string;
  type: string;
}

interface TransactionFormInitial {
  id: string;
  type: TxType;
  amount: number;
  occurredAt: Date;
  accountId?: string | null;
  categoryId?: string | null;
  payee?: string | null;
  memo?: string | null;
}

interface TransactionFormProps {
  categories: CategoryOpt[];
  accounts: AccountOpt[];
  defaultCategoryIdByKind?: Partial<Record<TxType, string>>;
  defaultAccountId?: string;
  initial?: TransactionFormInitial;
  onSuccess?: () => void;
}

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function dateToLocalInput(d: Date) {
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function TransactionForm({
  categories,
  accounts,
  defaultCategoryIdByKind,
  defaultAccountId,
  initial,
  onSuccess,
}: TransactionFormProps) {
  const isEdit = !!initial?.id;
  const [type, setType] = React.useState<TxType>(initial?.type ?? "expense");
  const [amount, setAmount] = React.useState(
    initial ? String(initial.amount) : ""
  );
  const [categoryId, setCategoryId] = React.useState<string | undefined>(
    initial?.categoryId ?? defaultCategoryIdByKind?.[initial?.type ?? "expense"]
  );
  const [accountId, setAccountId] = React.useState<string | undefined>(
    initial?.accountId ?? defaultAccountId ?? accounts[0]?.id
  );
  const [occurredAt, setOccurredAt] = React.useState(
    initial ? dateToLocalInput(initial.occurredAt) : todayLocal()
  );
  const [payee, setPayee] = React.useState(initial?.payee ?? "");
  const [memo, setMemo] = React.useState(initial?.memo ?? "");
  const [pending, startTransition] = useTransition();

  const filteredCategories = React.useMemo(
    () => categories.filter((c) => c.kind === type),
    [categories, type]
  );

  React.useEffect(() => {
    const def = defaultCategoryIdByKind?.[type];
    setCategoryId((prev) =>
      filteredCategories.some((c) => c.id === prev)
        ? prev
        : def ?? filteredCategories[0]?.id
    );
  }, [type, filteredCategories, defaultCategoryIdByKind]);

  function handleSubmit(formData: FormData) {
    formData.set("type", type);
    if (categoryId) formData.set("categoryId", categoryId);
    if (accountId) formData.set("accountId", accountId);
    formData.set("occurredAt", new Date(occurredAt).toISOString());
    if (isEdit && initial) formData.set("id", initial.id);

    startTransition(async () => {
      const result = isEdit
        ? await updateTransaction(formData)
        : await createTransaction(formData);
      if (result.ok) {
        toast.success(
          isEdit
            ? "수정했어요"
            : type === "income"
              ? "수입을 기록했어요"
              : "지출을 기록했어요"
        );
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.(10);
        }
        if (!isEdit) {
          setAmount("");
          setMemo("");
          setPayee("");
        }
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  const formattedAmount = amount
    ? new Intl.NumberFormat("ko-KR").format(Number(amount))
    : "0";

  const accentClass =
    type === "income" ? "text-success" : "text-danger";

  return (
    <form action={handleSubmit} className="space-y-5">
      <Tabs
        value={type}
        onValueChange={(v) => setType(v as TxType)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expense">지출</TabsTrigger>
          <TabsTrigger value="income">수입</TabsTrigger>
        </TabsList>
        <TabsContent value="expense" />
        <TabsContent value="income" />
      </Tabs>

      <div className="rounded-lg bg-muted/40 p-4">
        <div className="mb-1 text-body-s text-muted-foreground">금액</div>
        <div className={cn("flex items-baseline gap-1 tabular", accentClass)}>
          <span className="text-amount-l">₩</span>
          <input
            name="amount"
            value={amount}
            onChange={(e) => {
              const next = e.target.value.replace(/[^\d]/g, "");
              setAmount(next);
            }}
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

      <div className="space-y-1.5">
        <Label>카테고리</Label>
        {filteredCategories.length === 0 ? (
          <p className="text-body-s text-muted-foreground">
            먼저 설정에서 {type === "income" ? "수입" : "지출"} 카테고리를 추가해 주세요.
          </p>
        ) : (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
            {filteredCategories.map((c) => {
              const active = c.id === categoryId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    "flex min-w-[68px] shrink-0 flex-col items-center gap-1 rounded-md px-2 py-2 transition-colors",
                    active
                      ? "bg-primary/10 ring-2 ring-primary"
                      : "hover:bg-muted/60"
                  )}
                  aria-pressed={active}
                >
                  <CategoryIcon
                    icon={c.icon}
                    color={c.color}
                    size="md"
                    rounded="full"
                  />
                  <span className="text-caption">{c.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="account">계정</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger id="account">
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
          <Label htmlFor="occurredAt">날짜·시각</Label>
          <div className="relative">
            <CalendarDays
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
              aria-hidden
            />
            <Input
              id="occurredAt"
              name="occurredAt-display"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="payee">거래처</Label>
          <Input
            id="payee"
            name="payee"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            placeholder="예: 스타벅스"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="memo">메모</Label>
          <Input
            id="memo"
            name="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="짧은 한 줄"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending || !amount || !categoryId || !accountId}
        className="w-full"
      >
        {pending
          ? isEdit
            ? "수정하는 중..."
            : "기록하는 중..."
          : isEdit
            ? "수정"
            : "기록하기"}
      </Button>
    </form>
  );
}
