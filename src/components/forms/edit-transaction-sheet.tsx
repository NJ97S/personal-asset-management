"use client";

import * as React from "react";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ResponsiveSheet } from "./responsive-sheet";
import { TransactionForm } from "./transaction-form";
import { TransferForm } from "./transfer-form";
import { TradeForm } from "./trade-form";
import { deleteTransaction } from "@/lib/actions/transactions";

export type EditableTransaction = {
  id: string;
  type: "income" | "expense" | "transfer" | "trade";
  occurredAt: Date;
  amount: number;
  payee: string | null;
  memo: string | null;
  accountId: string | null;
  categoryId: string | null;
  fromAccountId: string | null;
  toAccountId: string | null;
  tradeKind: "buy" | "sell" | null;
  ticker: string | null;
  quantity: number | null;
  pricePerUnit: number | null;
  fee: number | null;
};

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

interface EditTransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: EditableTransaction | null;
  categories: CategoryOpt[];
  accounts: AccountOpt[];
}

const TITLE_BY_TYPE: Record<EditableTransaction["type"], string> = {
  income: "수입 편집",
  expense: "지출 편집",
  transfer: "이체 편집",
  trade: "매매 편집",
};

export function EditTransactionSheet({
  open,
  onOpenChange,
  transaction,
  categories,
  accounts,
}: EditTransactionSheetProps) {
  const [deleting, startDelete] = useTransition();

  if (!transaction) return null;
  const t = transaction;

  const handleSuccess = () => onOpenChange(false);

  const handleDelete = () => {
    if (!confirm("이 거래를 삭제할까요? 되돌릴 수 없어요.")) return;
    startDelete(async () => {
      const result = await deleteTransaction(t.id);
      if (result.ok) {
        toast.success("삭제했어요");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={TITLE_BY_TYPE[t.type]}
    >
      <div className="space-y-4">
        {(t.type === "income" || t.type === "expense") && (
          <TransactionForm
            categories={categories}
            accounts={accounts}
            initial={{
              id: t.id,
              type: t.type,
              amount: t.amount,
              occurredAt: t.occurredAt,
              accountId: t.accountId,
              categoryId: t.categoryId,
              payee: t.payee,
              memo: t.memo,
            }}
            onSuccess={handleSuccess}
          />
        )}

        {t.type === "transfer" && (
          <TransferForm
            accounts={accounts}
            initial={{
              id: t.id,
              amount: t.amount,
              occurredAt: t.occurredAt,
              fromAccountId: t.fromAccountId,
              toAccountId: t.toAccountId,
              memo: t.memo,
            }}
            onSuccess={handleSuccess}
          />
        )}

        {t.type === "trade" && t.tradeKind && t.ticker && (
          <TradeForm
            accounts={accounts}
            initial={{
              id: t.id,
              tradeKind: t.tradeKind,
              accountId: t.accountId,
              ticker: t.ticker,
              quantity: t.quantity ?? 0,
              pricePerUnit: t.pricePerUnit ?? 0,
              fee: t.fee ?? 0,
              occurredAt: t.occurredAt,
              memo: t.memo,
            }}
            onSuccess={handleSuccess}
          />
        )}

        <div className="border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full text-danger hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "삭제하는 중..." : "삭제"}
          </Button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}
