import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { isLiabilityAccount } from "./balances";

export interface NetWorthPoint {
  /** YYYY-MM (month-end snapshot) */
  month: string;
  monthEnd: Date;
  assets: number;
  liabilities: number;
  netWorth: number;
}

function endOfMonth(year: number, monthIndex: number): Date {
  // monthIndex 는 0-based. 다음 달 0일 = 이 달 마지막 날.
  return new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
}

/**
 * 월말 시점별 순자산 시계열 계산.
 * 거래를 한 번 가져와 시간순으로 정렬 후, 각 월말 컷오프까지 누적해서 잔액 산정.
 *
 * 거래 수가 N, 컷오프 수가 M 이면 시간 복잡도 O(N + M·N). 1인 사용자 N < 10k 라 충분히 빠름.
 * 추후 N 이 커지면 컷오프 순회를 한 번에 fold(거래 정렬 + 컷오프 정렬 + 두 포인터) 로 바꿀 수 있음.
 */
export async function computeNetWorthSeries(
  userId: string,
  months = 12
): Promise<NetWorthPoint[]> {
  const [accounts, txs] = await Promise.all([
    db.select().from(schema.accounts).where(eq(schema.accounts.userId, userId)),
    db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userId))
      .orderBy(asc(schema.transactions.occurredAt)),
  ]);

  const now = new Date();
  const cutoffs: Date[] = [];
  for (let i = months - 1; i >= 0; i--) {
    cutoffs.push(endOfMonth(now.getFullYear(), now.getMonth() - i));
  }

  return cutoffs.map((cutoff) => {
    const balances = new Map<string, number>();
    for (const a of accounts) balances.set(a.id, a.initialBalance);

    const add = (id: string | null | undefined, delta: number) => {
      if (!id) return;
      balances.set(id, (balances.get(id) ?? 0) + delta);
    };

    for (const t of txs) {
      if (t.occurredAt > cutoff) break;
      switch (t.type) {
        case "income":
          add(t.accountId, t.amount);
          break;
        case "expense":
          add(t.accountId, -t.amount);
          break;
        case "transfer":
          add(t.fromAccountId, -t.amount);
          add(t.toAccountId, t.amount);
          break;
        case "trade": {
          const sign = t.tradeKind === "sell" ? 1 : -1;
          add(t.accountId, sign * t.amount);
          break;
        }
      }
    }

    let assets = 0;
    let liabilities = 0;
    for (const a of accounts) {
      if (a.isArchived) continue;
      const bal = balances.get(a.id) ?? a.initialBalance;
      if (isLiabilityAccount(a.type)) {
        liabilities += Math.max(0, -bal);
      } else {
        assets += bal;
      }
    }

    return {
      month: `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}`,
      monthEnd: cutoff,
      assets,
      liabilities,
      netWorth: assets - liabilities,
    };
  });
}
