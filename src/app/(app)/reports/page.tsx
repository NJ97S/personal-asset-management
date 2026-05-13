import { TopNav } from "@/components/nav/top-nav";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/domain/metric-card";
import { EmptyState } from "@/components/domain/empty-state";
import {
  CategoryDonut,
  CategoryLegend,
  DailyBar,
  NetWorthLine,
} from "@/components/charts/lazy";
import { getSession } from "@/lib/auth";
import { db, schema } from "@/db";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { formatKRW } from "@/lib/utils";
import { computeNetWorthSeries } from "@/lib/queries/networth-series";

export const dynamic = "force-dynamic";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const userId = session.user.id;
  const { month } = await searchParams;

  const baseDate = month
    ? new Date(`${month}-01T00:00:00`)
    : new Date();
  const monthStart = startOfMonth(baseDate);
  const monthEnd = endOfMonth(baseDate);

  const prevDate = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
  const prevStart = startOfMonth(prevDate);
  const prevEnd = endOfMonth(prevDate);

  const [thisMonth, lastMonth, categories, netWorthSeries] = await Promise.all([
    db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, userId),
          gte(schema.transactions.occurredAt, monthStart),
          lte(schema.transactions.occurredAt, monthEnd)
        )
      )
      .orderBy(desc(schema.transactions.occurredAt)),
    db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, userId),
          gte(schema.transactions.occurredAt, prevStart),
          lte(schema.transactions.occurredAt, prevEnd)
        )
      ),
    db.select().from(schema.categories).where(eq(schema.categories.userId, userId)),
    computeNetWorthSeries(userId, 12),
  ]);

  const expenseTxs = thisMonth.filter((t) => t.type === "expense");
  const incomeTxs = thisMonth.filter((t) => t.type === "income");
  const expenseTotal = expenseTxs.reduce((acc, t) => acc + t.amount, 0);
  const incomeTotal = incomeTxs.reduce((acc, t) => acc + t.amount, 0);
  const lastExpenseTotal = lastMonth
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const lastIncomeTotal = lastMonth
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const catLookup = new Map(categories.map((c) => [c.id, c]));
  const byCategory = new Map<string, number>();
  for (const t of expenseTxs) {
    if (!t.categoryId) continue;
    byCategory.set(t.categoryId, (byCategory.get(t.categoryId) ?? 0) + t.amount);
  }
  const slices = Array.from(byCategory.entries()).map(([id, amount]) => ({
    id,
    name: catLookup.get(id)?.name ?? "기타",
    amount,
    color: catLookup.get(id)?.color ?? "#9CA3AF",
  }));

  const daysInMonth = monthEnd.getDate();
  const daily: { date: string; expense: number; income: number }[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), i);
    daily.push({ date: dayKey(d), expense: 0, income: 0 });
  }
  for (const t of thisMonth) {
    const idx = t.occurredAt.getDate() - 1;
    if (idx < 0 || idx >= daily.length) continue;
    if (t.type === "expense") daily[idx].expense += t.amount;
    if (t.type === "income") daily[idx].income += t.amount;
  }

  const payeeMap = new Map<string, number>();
  for (const t of expenseTxs) {
    const key = t.payee?.trim() || (t.categoryId ? catLookup.get(t.categoryId)?.name : null) || "기타";
    payeeMap.set(key, (payeeMap.get(key) ?? 0) + t.amount);
  }
  const topPayees = Array.from(payeeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const monthLabel = `${baseDate.getFullYear()}년 ${baseDate.getMonth() + 1}월`;

  if (thisMonth.length === 0 && lastMonth.length === 0) {
    return (
      <>
        <TopNav title="리포트" />
        <div className="p-4">
          <Card>
            <EmptyState
              title="이번 달 거래가 없어요"
              description="가계부에 첫 거래를 추가하면 리포트가 채워져요."
            />
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <TopNav title="리포트" />
      <div className="space-y-3 p-4">
        <p className="text-body-s text-muted-foreground">{monthLabel}</p>

        <div className="grid gap-3 md:grid-cols-2">
          <MetricCard
            label="이번 달 지출"
            amount={expenseTotal}
            previous={lastExpenseTotal}
            tone="danger"
            size="l"
            hint="전월 대비"
          />
          <MetricCard
            label="이번 달 수입"
            amount={incomeTotal}
            previous={lastIncomeTotal}
            tone="success"
            size="l"
            hint="전월 대비"
          />
        </div>

        <Card>
          <div className="flex items-baseline justify-between pb-3">
            <h2 className="text-heading-m">순자산 추이 · 12개월</h2>
            {netWorthSeries.length > 0 ? (
              <span className="tabular text-body-s text-muted-foreground">
                현재 {formatKRW(netWorthSeries[netWorthSeries.length - 1]?.netWorth ?? 0)}
              </span>
            ) : null}
          </div>
          <NetWorthLine data={netWorthSeries} />
          <div className="mt-2 flex items-center gap-4 text-caption text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-sm bg-brand-green" />
              순자산
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-3 bg-brand-blue" />
              자산
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-3 bg-danger" />
              부채
            </span>
          </div>
        </Card>

        <Card>
          <div className="pb-3">
            <h2 className="text-heading-m">카테고리별 지출</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-[260px_1fr]">
            <CategoryDonut data={slices} total={expenseTotal} />
            <CategoryLegend data={slices} total={expenseTotal} />
          </div>
        </Card>

        <Card>
          <div className="pb-3">
            <h2 className="text-heading-m">일별 지출·수입</h2>
          </div>
          <DailyBar data={daily} />
        </Card>

        <Card>
          <div className="pb-3">
            <h2 className="text-heading-m">상위 거래처 5</h2>
            <p className="text-body-s text-muted-foreground">
              지출이 큰 순서. 거래처가 비어 있으면 카테고리 이름으로 묶어요.
            </p>
          </div>
          {topPayees.length === 0 ? (
            <p className="py-4 text-center text-body-m text-muted-foreground">
              아직 데이터가 부족해요.
            </p>
          ) : (
            <ol className="space-y-2">
              {topPayees.map(([name, amount], i) => (
                <li key={name} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-caption font-bold">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-body-l">{name}</span>
                  <span className="tabular text-amount-m text-danger">
                    -{formatKRW(amount)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  );
}
