import { notFound } from "next/navigation";
import { TopNav } from "@/components/nav/top-nav";
import { Card } from "@/components/ui/card";
import { ListItem } from "@/components/domain/list-item";
import { CategoryIcon } from "@/components/domain/category-icon";
import { DateGroupHeader } from "@/components/domain/date-group-header";
import { EmptyState } from "@/components/domain/empty-state";
import { getSession } from "@/lib/auth";
import { db, schema } from "@/db";
import { and, desc, eq, or } from "drizzle-orm";
import { computeAccountBalancesWithHoldings, isLiabilityAccount } from "@/lib/queries/balances";
import { formatKRW, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const { id } = await params;

  const accounts = await computeAccountBalancesWithHoldings(session.user.id);
  const account = accounts.find((a) => a.id === id);
  if (!account) notFound();

  const liability = isLiabilityAccount(account.type);
  const displayBalance = liability
    ? Math.max(0, -account.balance)
    : account.balance;

  const txs = await db
    .select({
      id: schema.transactions.id,
      occurredAt: schema.transactions.occurredAt,
      type: schema.transactions.type,
      amount: schema.transactions.amount,
      payee: schema.transactions.payee,
      memo: schema.transactions.memo,
      accountId: schema.transactions.accountId,
      fromAccountId: schema.transactions.fromAccountId,
      toAccountId: schema.transactions.toAccountId,
      categoryName: schema.categories.name,
      categoryIcon: schema.categories.icon,
      categoryColor: schema.categories.color,
    })
    .from(schema.transactions)
    .leftJoin(
      schema.categories,
      eq(schema.transactions.categoryId, schema.categories.id)
    )
    .where(
      and(
        eq(schema.transactions.userId, session.user.id),
        or(
          eq(schema.transactions.accountId, id),
          eq(schema.transactions.fromAccountId, id),
          eq(schema.transactions.toAccountId, id)
        )
      )
    )
    .orderBy(desc(schema.transactions.occurredAt))
    .limit(200);

  const groups = new Map<
    string,
    { date: Date; rows: typeof txs; income: number; expense: number }
  >();
  for (const t of txs) {
    const key = dayKey(t.occurredAt);
    if (!groups.has(key)) {
      groups.set(key, { date: t.occurredAt, rows: [], income: 0, expense: 0 });
    }
    const g = groups.get(key)!;
    g.rows.push(t);
    // For this account's perspective:
    if (t.type === "income" && t.accountId === id) g.income += t.amount;
    else if (t.type === "expense" && t.accountId === id) g.expense += t.amount;
    else if (t.type === "transfer") {
      if (t.toAccountId === id) g.income += t.amount;
      if (t.fromAccountId === id) g.expense += t.amount;
    }
  }

  return (
    <>
      <TopNav title={account.name} back="/accounts" />
      <div className="space-y-3 p-4">
        <Card className="flex items-center gap-3">
          <CategoryIcon
            icon={accountIconMap[account.type] ?? "Wallet"}
            color={account.color}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <div className="text-body-s text-muted-foreground">
              {accountLabelMap[account.type] ?? account.type}
              {liability ? " · 부채" : ""}
              {account.currency !== "KRW" ? ` · ${account.currency}` : ""}
            </div>
            <div className="truncate text-heading-m">{account.name}</div>
          </div>
          <div
            className={
              "tabular text-amount-l " +
              (liability ? "text-danger" : "text-foreground")
            }
          >
            {liability ? "-" : ""}
            {formatKRW(displayBalance)}
          </div>
        </Card>

        {txs.length === 0 ? (
          <Card>
            <EmptyState
              title="아직 거래가 없어요"
              description="이 계정으로 첫 거래를 추가해 보세요."
            />
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            {Array.from(groups.values()).map((g, i) => (
              <div key={i}>
                <DateGroupHeader
                  date={g.date}
                  income={g.income || undefined}
                  expense={g.expense || undefined}
                />
                <div className="divide-y divide-border">
                  {g.rows.map((t) => {
                    const isOut =
                      t.type === "expense" ||
                      (t.type === "transfer" && t.fromAccountId === id);
                    const isIn =
                      t.type === "income" ||
                      (t.type === "transfer" && t.toAccountId === id);
                    const variant: "income" | "expense" | "neutral" = isIn
                      ? "income"
                      : isOut
                        ? "expense"
                        : "neutral";
                    const titleFromType =
                      t.type === "transfer"
                        ? isOut
                          ? "이체 (보냄)"
                          : "이체 (받음)"
                        : (t.payee ?? t.categoryName ?? t.memo ?? "거래");
                    return (
                      <ListItem
                        key={t.id}
                        icon={{ name: t.categoryIcon, color: t.categoryColor }}
                        title={titleFromType}
                        subtitle={
                          t.categoryName
                            ? t.memo
                              ? `${t.categoryName} · ${t.memo}`
                              : t.categoryName
                            : t.memo ?? undefined
                        }
                        amount={t.amount}
                        amountVariant={variant}
                        meta={formatTime(t.occurredAt)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </>
  );
}
