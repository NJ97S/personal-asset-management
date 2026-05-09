import { TopNav } from "@/components/nav/top-nav";
import { Card } from "@/components/ui/card";
import { ListItem } from "@/components/domain/list-item";
import { DateGroupHeader } from "@/components/domain/date-group-header";
import { EmptyState } from "@/components/domain/empty-state";
import { NewTransactionButton } from "@/components/forms/new-transaction-button";
import { TransactionHotkeyListener } from "@/components/forms/transaction-hotkey-listener";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { formatTime } from "@/lib/utils";
import { loadFormDefaults } from "@/lib/queries/dashboard";

export const dynamic = "force-dynamic";

function dayKey(d: Date) {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const [txs, defaults] = await Promise.all([
    db
      .select({
        id: schema.transactions.id,
        occurredAt: schema.transactions.occurredAt,
        type: schema.transactions.type,
        amount: schema.transactions.amount,
        payee: schema.transactions.payee,
        memo: schema.transactions.memo,
        categoryName: schema.categories.name,
        categoryIcon: schema.categories.icon,
        categoryColor: schema.categories.color,
      })
      .from(schema.transactions)
      .leftJoin(
        schema.categories,
        eq(schema.transactions.categoryId, schema.categories.id)
      )
      .where(eq(schema.transactions.userId, userId))
      .orderBy(desc(schema.transactions.occurredAt))
      .limit(200),
    loadFormDefaults(userId),
  ]);

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
    if (t.type === "income") g.income += t.amount;
    if (t.type === "expense") g.expense += t.amount;
  }

  const newButton = (
    <NewTransactionButton
      categories={defaults.categories}
      accounts={defaults.accounts}
      defaultCategoryIdByKind={defaults.defaultCategoryIdByKind}
      defaultAccountId={defaults.defaultAccountId}
      label="추가"
    />
  );

  return (
    <>
      <TransactionHotkeyListener />
      <TopNav title="가계부" right={newButton} />
      <div className="p-4">
        {txs.length === 0 ? (
          <Card>
            <EmptyState
              title="아직 기록이 없어요"
              description="첫 거래를 추가해 볼까요?"
              action={
                <NewTransactionButton
                  categories={defaults.categories}
                  accounts={defaults.accounts}
                  defaultCategoryIdByKind={defaults.defaultCategoryIdByKind}
                  defaultAccountId={defaults.defaultAccountId}
                  label="거래 추가"
                  size="default"
                />
              }
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
                    />
                  ))}
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </>
  );
}
