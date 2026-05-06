"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResponsiveSheet } from "./responsive-sheet";
import { TransactionForm } from "./transaction-form";
import { TransferForm } from "./transfer-form";
import { TradeForm } from "./trade-form";

type TxType = "expense" | "income";

interface NewTransactionButtonProps {
  categories: React.ComponentProps<typeof TransactionForm>["categories"];
  accounts: React.ComponentProps<typeof TransactionForm>["accounts"];
  defaultCategoryIdByKind?: Partial<Record<TxType, string>>;
  defaultAccountId?: string;
  label?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
  iconOnly?: boolean;
}

export function NewTransactionButton({
  categories,
  accounts,
  defaultCategoryIdByKind,
  defaultAccountId,
  label = "새 거래",
  size = "sm",
  variant = "default",
  iconOnly = false,
}: NewTransactionButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [kind, setKind] = React.useState<
    "expense_income" | "transfer" | "trade"
  >("expense_income");

  function handleSuccess() {
    setOpen(false);
  }

  return (
    <>
      <Button
        size={iconOnly ? "icon" : size}
        variant={variant}
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        {iconOnly ? null : <span>{label}</span>}
      </Button>
      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title="새 거래"
        description="3초 안에 한 줄 기록"
      >
        <Tabs
          value={kind}
          onValueChange={(v) => setKind(v as typeof kind)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="expense_income">지출·수입</TabsTrigger>
            <TabsTrigger value="transfer">이체</TabsTrigger>
            <TabsTrigger value="trade">매매</TabsTrigger>
          </TabsList>
          <TabsContent value="expense_income" className="pt-4">
            <TransactionForm
              categories={categories}
              accounts={accounts}
              defaultCategoryIdByKind={defaultCategoryIdByKind}
              defaultAccountId={defaultAccountId}
              onSuccess={handleSuccess}
            />
          </TabsContent>
          <TabsContent value="transfer" className="pt-4">
            {accounts.length < 2 ? (
              <p className="py-6 text-center text-body-m text-muted-foreground">
                이체는 두 개 이상의 계정이 있을 때 가능해요.
              </p>
            ) : (
              <TransferForm
                accounts={accounts}
                defaultFromAccountId={defaultAccountId}
                onSuccess={handleSuccess}
              />
            )}
          </TabsContent>
          <TabsContent value="trade" className="pt-4">
            {accounts.length === 0 ? (
              <p className="py-6 text-center text-body-m text-muted-foreground">
                먼저 계정을 추가해야 매매 거래를 기록할 수 있어요.
              </p>
            ) : (
              <TradeForm
                accounts={accounts}
                defaultAccountId={defaultAccountId}
                onSuccess={handleSuccess}
              />
            )}
          </TabsContent>
        </Tabs>
      </ResponsiveSheet>
    </>
  );
}
