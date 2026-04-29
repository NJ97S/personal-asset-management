"use client";

import * as React from "react";
import { Plus, Pencil, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/domain/category-icon";
import { ResponsiveSheet } from "./responsive-sheet";
import { AccountForm } from "./account-form";
import { archiveAccount } from "@/lib/actions/accounts";
import { cn, formatKRW } from "@/lib/utils";

type Account = {
  id: string;
  name: string;
  type:
    | "cash"
    | "bank"
    | "credit_card"
    | "stock"
    | "crypto"
    | "real_estate"
    | "loan"
    | "other";
  currency: string;
  initialBalance: number;
  color: string | null;
  sortOrder: number;
  isArchived: boolean;
};

const accountIconMap: Record<string, string> = {
  cash: "Wallet",
  bank: "Landmark",
  credit_card: "CreditCard",
  stock: "TrendingUp",
  crypto: "Bitcoin",
  real_estate: "Building2",
  loan: "HandCoins",
  other: "Coins",
};

const accountLabelMap: Record<string, string> = {
  cash: "현금",
  bank: "은행",
  credit_card: "카드",
  stock: "증권",
  crypto: "암호화폐",
  real_estate: "부동산",
  loan: "대출",
  other: "기타",
};

interface AccountManagerProps {
  accounts: Account[];
}

export function AccountManager({ accounts }: AccountManagerProps) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Account | undefined>();
  const [, startTransition] = useTransition();

  function startNew() {
    setEditing(undefined);
    setOpen(true);
  }

  function startEdit(a: Account) {
    setEditing(a);
    setOpen(true);
  }

  function toggleArchive(a: Account) {
    startTransition(async () => {
      const result = await archiveAccount(a.id, !a.isArchived);
      if (result.ok) {
        toast.success(a.isArchived ? "다시 사용할게요" : "보관함으로 옮겼어요");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-body-s text-muted-foreground">
          {accounts.filter((a) => !a.isArchived).length}개 활성 ·{" "}
          {accounts.filter((a) => a.isArchived).length}개 보관
        </p>
        <Button size="sm" onClick={startNew}>
          <Plus className="h-4 w-4" /> 추가
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        {accounts.length === 0 ? (
          <p className="p-6 text-center text-body-m text-muted-foreground">
            계정이 없어요. 우측 상단 추가 버튼으로 만들어 보세요.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {accounts.map((a) => (
              <li
                key={a.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  a.isArchived && "opacity-50"
                )}
              >
                <CategoryIcon
                  icon={accountIconMap[a.type] ?? "Wallet"}
                  color={a.color}
                  size="md"
                />
                <div className="flex-1 truncate">
                  <p className="text-body-l font-medium">{a.name}</p>
                  <p className="text-body-s text-muted-foreground">
                    {accountLabelMap[a.type] ?? a.type} · {a.currency}
                    {a.isArchived ? " · 보관됨" : ""}
                  </p>
                </div>
                <span className="tabular text-body-m text-muted-foreground">
                  초기 {formatKRW(a.initialBalance)}
                </span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => toggleArchive(a)}
                  aria-label={a.isArchived ? "다시 사용" : "보관"}
                >
                  {a.isArchived ? (
                    <ArchiveRestore className="h-4 w-4" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => startEdit(a)}
                  aria-label="편집"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title={editing ? "계정 편집" : "새 계정"}
      >
        <AccountForm
          initial={
            editing
              ? {
                  id: editing.id,
                  name: editing.name,
                  type: editing.type,
                  currency: editing.currency,
                  initialBalance: editing.initialBalance,
                  color: editing.color,
                  sortOrder: editing.sortOrder,
                }
              : undefined
          }
          onSuccess={() => setOpen(false)}
        />
      </ResponsiveSheet>
    </div>
  );
}
