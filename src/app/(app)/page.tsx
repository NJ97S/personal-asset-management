import Link from "next/link";
import { Plus } from "lucide-react";
import { TopNav } from "@/components/nav/top-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/domain/metric-card";
import { ListItem } from "@/components/domain/list-item";
import { EmptyState } from "@/components/domain/empty-state";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { formatKRW } from "@/lib/utils";

export const dynamic = "force-dynamic";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

async function loadDashboard(userId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthly = await db
    .select()
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.userId, userId),
        gte(schema.transactions.occurredAt, monthStart),
        lte(schema.transactions.occurredAt, monthEnd)
      )
    );

  const expense = monthly
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const income = monthly
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const recent = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.userId, userId))
    .orderBy(desc(schema.transactions.occurredAt))
    .limit(5);

  const accountsRows = await db
    .select()
    .from(schema.accounts)
    .where(eq(schema.accounts.userId, userId));

  return { expense, income, recent, accountsCount: accountsRows.length };
}

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  const data = await loadDashboard(session.user.id);
  const isEmpty =
    data.recent.length === 0 && data.accountsCount === 0;

  const now = new Date();
  const monthLabel = `${now.getMonth() + 1}월`;

  return (
    <>
      <TopNav
        title="내 자산"
        right={
          <Button size="sm" asChild>
            <Link href={"/transactions/new" as never}>
              <Plus className="h-4 w-4" />
              <span>새 거래</span>
            </Link>
          </Button>
        }
      />

      <div className="space-y-3 p-4">
        {isEmpty ? (
          <Card>
            <EmptyState
              title="첫 거래를 기록해 보세요"
              description="가계부와 자산 추이는 거래 입력에서 시작돼요."
              action={
                <Button asChild>
                  <Link href={"/transactions/new" as never}>
                    <Plus className="h-4 w-4" />첫 거래 추가
                  </Link>
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <MetricCard
                label={`${monthLabel} 지출`}
                amount={data.expense}
                tone="danger"
                size="l"
              />
              <MetricCard
                label={`${monthLabel} 수입`}
                amount={data.income}
                tone="success"
                size="l"
              />
            </div>

            <Card>
              <div className="flex items-center justify-between pb-2">
                <h2 className="text-heading-m">최근 거래</h2>
                <Link
                  href={"/transactions" as never}
                  className="text-body-s text-muted-foreground hover:text-foreground"
                >
                  전체 보기
                </Link>
              </div>
              <div className="-mx-4">
                {data.recent.length === 0 ? (
                  <p className="px-4 py-6 text-center text-body-m text-muted-foreground">
                    이번 달엔 아직 거래가 없어요.
                  </p>
                ) : (
                  data.recent.map((t) => (
                    <ListItem
                      key={t.id}
                      title={t.payee ?? t.memo ?? "거래"}
                      subtitle={t.memo ?? undefined}
                      amount={t.amount}
                      amountVariant={
                        t.type === "income" ? "income" : "expense"
                      }
                    />
                  ))
                )}
              </div>
            </Card>

            <div className="grid gap-3 md:grid-cols-2">
              <Card className="flex items-center justify-between">
                <div>
                  <p className="text-body-s text-muted-foreground">
                    이번 달 합계
                  </p>
                  <p className="tabular text-amount-l">
                    {formatKRW(data.income - data.expense)}
                  </p>
                </div>
                <Button size="sm" variant="secondary" asChild>
                  <Link href={"/reports" as never}>리포트 →</Link>
                </Button>
              </Card>
              <Card className="flex items-center justify-between">
                <div>
                  <p className="text-body-s text-muted-foreground">계정 수</p>
                  <p className="tabular text-amount-l">
                    {data.accountsCount}
                  </p>
                </div>
                <Button size="sm" variant="secondary" asChild>
                  <Link href={"/accounts" as never}>관리 →</Link>
                </Button>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  );
}
