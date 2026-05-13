"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TransactionForm } from "./transaction-form";

type TxType = "expense" | "income";

const NewTransactionSheet = dynamic(
  () => import("./new-transaction-sheet").then((m) => m.NewTransactionSheet),
  { ssr: false, loading: () => null }
);

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
  const [hasOpened, setHasOpened] = React.useState(false);

  const requestOpen = React.useCallback(() => {
    setHasOpened(true);
    setOpen(true);
  }, []);

  React.useEffect(() => {
    window.addEventListener("open-new-transaction", requestOpen);
    return () => window.removeEventListener("open-new-transaction", requestOpen);
  }, [requestOpen]);

  return (
    <>
      <Button
        size={iconOnly ? "icon" : size}
        variant={variant}
        onClick={requestOpen}
      >
        <Plus className="h-4 w-4" />
        {iconOnly ? null : <span>{label}</span>}
      </Button>
      {hasOpened ? (
        <NewTransactionSheet
          open={open}
          onOpenChange={setOpen}
          categories={categories}
          accounts={accounts}
          defaultCategoryIdByKind={defaultCategoryIdByKind}
          defaultAccountId={defaultAccountId}
        />
      ) : null}
    </>
  );
}
