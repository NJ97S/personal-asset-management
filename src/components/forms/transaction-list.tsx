"use client";

import * as React from "react";
import { ListItem } from "@/components/domain/list-item";
import { DateGroupHeader } from "@/components/domain/date-group-header";
import { Card } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";
import {
  EditTransactionSheet,
  type EditableTransaction,
} from "./edit-transaction-sheet";

export type TransactionListRow = EditableTransaction & {
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
};

export interface TransactionListGroup {
  /** Group key (yyyy-mm-dd in KST) — used as React key */
  key: string;
  /** Representative date for the group header (first tx in the group) */
  date: Date;
  income: number;
  expense: number;
  rows: TransactionListRow[];
}

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

interface TransactionListProps {
  groups: TransactionListGroup[];
  accounts: AccountOpt[];
  categories: CategoryOpt[];
}

export function TransactionList({
  groups,
  accounts,
  categories,
}: TransactionListProps) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<EditableTransaction | null>(
    null
  );

  function openRow(row: TransactionListRow) {
    setSelected(row);
    setOpen(true);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setSelected(null);
  }

  return (
    <>
      <Card className="p-0">
        {groups.map((g) => (
          <div key={g.key}>
            <DateGroupHeader
              date={g.date}
              income={g.income || undefined}
              expense={g.expense || undefined}
            />
            <div className="divide-y divide-border">
              {g.rows.map((t) => (
                <ListItem
                  key={t.id}
                  icon={{ name: t.categoryIcon, color: t.categoryColor }}
                  title={t.payee ?? t.categoryName ?? t.memo ?? "거래"}
                  subtitle={
                    t.categoryName
                      ? t.memo
                        ? `${t.categoryName} · ${t.memo}`
                        : t.categoryName
                      : t.memo ?? undefined
                  }
                  amount={t.amount}
                  amountVariant={
                    t.type === "income"
                      ? "income"
                      : t.type === "expense"
                        ? "expense"
                        : "neutral"
                  }
                  meta={formatTime(t.occurredAt)}
                  asAction
                  role="button"
                  tabIndex={0}
                  onClick={() => openRow(t)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openRow(t);
                    }
                  }}
                  aria-label="거래 편집"
                />
              ))}
            </div>
          </div>
        ))}
      </Card>

      <EditTransactionSheet
        open={open}
        onOpenChange={handleOpenChange}
        transaction={selected}
        categories={categories}
        accounts={accounts}
      />
    </>
  );
}
