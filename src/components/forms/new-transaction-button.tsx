"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ResponsiveSheet } from "./responsive-sheet";
import { TransactionForm } from "./transaction-form";

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
        <TransactionForm
          categories={categories}
          accounts={accounts}
          defaultCategoryIdByKind={defaultCategoryIdByKind}
          defaultAccountId={defaultAccountId}
          onSuccess={() => setOpen(false)}
        />
      </ResponsiveSheet>
    </>
  );
}
