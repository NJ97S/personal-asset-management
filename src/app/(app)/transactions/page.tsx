import Link from "next/link";
import { Plus } from "lucide-react";
import { TopNav } from "@/components/nav/top-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListItem } from "@/components/domain/list-item";
import { DateGroupHeader } from "@/components/domain/date-group-header";
import { EmptyState } from "@/components/domain/empty-state";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function dayKey(d: Date) {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const txs = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.userId, session.user.id))
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
    if (t.type === "income") g.income += t.amount;
    if (t.type === "expense") g.expense += t.amount;
  }

  return (
    <>
      <TopNav
        title="가계부"
        right={
          <Button size="sm" asChild>
            <Link href={"/transactions/new" as never}>
              <Plus className="h-4 w-4" /> 추가
            </Link>
          </Button>
        }
      />
      <div className="p-4">
        {txs.length === 0 ? (
          <Card>
            <EmptyState
              title="아직 기록이 없어요"
              description="첫 거래를 추가해 볼까요?"
              action={
                <Button asChild>
                  <Link href={"/transactions/new" as never}>거래 추가</Link>
                </Button>
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
                      title={t.payee ?? t.memo ?? "거래"}
                      subtitle={t.memo ?? undefined}
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
