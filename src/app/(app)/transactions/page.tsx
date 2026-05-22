import { TopNav } from "@/components/nav/top-nav";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/domain/empty-state";
import { NewTransactionButton } from "@/components/forms/new-transaction-button";
import { TransactionHotkeyListener } from "@/components/forms/transaction-hotkey-listener";
import {
  TransactionList,
  type TransactionListGroup,
  type TransactionListRow,
} from "@/components/forms/transaction-list";
import { getSession } from "@/lib/auth";
import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { loadFormDefaults } from "@/lib/queries/dashboard";

export const dynamic = "force-dynamic";

function dayKey(d: Date) {
  // Use explicit KST (Asia/Seoul) so grouping is consistent between
  // UTC Vercel servers and the browser. Without this, transactions
  // near midnight KST end up in the wrong date group on the server,
  // causing a hydration mismatch that breaks the list layout.
  const kst = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return kst; // "YYYY-MM-DD"
}

export default async function TransactionsPage() {
  const session = await getSession();
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
        accountId: schema.transactions.accountId,
        categoryId: schema.transactions.categoryId,
        fromAccountId: schema.transactions.fromAccountId,
        toAccountId: schema.transactions.toAccountId,
        tradeKind: schema.transactions.tradeKind,
        ticker: schema.transactions.ticker,
        quantity: schema.transactions.quantity,
        pricePerUnit: schema.transactions.pricePerUnit,
        fee: schema.transactions.fee,
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

  const groups = new Map<string, TransactionListGroup>();
  for (const t of txs) {
    const key = dayKey(t.occurredAt);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        date: t.occurredAt,
        rows: [],
        income: 0,
        expense: 0,
      });
    }
    const g = groups.get(key)!;
    const row: TransactionListRow = {
      id: t.id,
      type: t.type,
      occurredAt: t.occurredAt,
      amount: t.amount,
      payee: t.payee,
      memo: t.memo,
      accountId: t.accountId,
      categoryId: t.categoryId,
      fromAccountId: t.fromAccountId,
      toAccountId: t.toAccountId,
      tradeKind: t.tradeKind,
      ticker: t.ticker,
      quantity: t.quantity,
      pricePerUnit: t.pricePerUnit,
      fee: t.fee,
      categoryName: t.categoryName,
      categoryIcon: t.categoryIcon,
      categoryColor: t.categoryColor,
    };
    g.rows.push(row);
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
          <TransactionList
            groups={Array.from(groups.values())}
            accounts={defaults.accounts}
            categories={defaults.categories}
          />
        )}
      </div>
    </>
  );
}
