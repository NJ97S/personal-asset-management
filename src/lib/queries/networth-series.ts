import { asc, eq, inArray } from "drizzle-orm";
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
  return new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
}

const HOLDINGS_ACCOUNT_TYPES = new Set<typeof schema.accountTypeEnum[number]>([
  "stock",
  "crypto",
]);

/**
 * 월말 시점별 순자산 시계열 계산.
 * 거래는 정밀(이력 기반), 보유 종목은 "현재 보유량 × 해당 월말 직전 종가" 근사.
 * holdings 테이블에 시점별 보유량 이력이 없어 정확한 과거 계산은 불가.
 */
export async function computeNetWorthSeries(
  userId: string,
  months = 12
): Promise<NetWorthPoint[]> {
  const [accounts, txs, holdings] = await Promise.all([
    db.select().from(schema.accounts).where(eq(schema.accounts.userId, userId)),
    db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userId))
      .orderBy(asc(schema.transactions.occurredAt)),
    db.select().from(schema.holdings).where(eq(schema.holdings.userId, userId)),
  ]);

  // manualValue > 0 만 진짜 수동 평가, 그 외(특히 과거 버그로 저장된 0)는 시세 경로.
  const hasManualValue = (h: { manualValue: number | null }) =>
    h.manualValue != null && h.manualValue > 0;
  const tickers = [
    ...new Set(holdings.filter((h) => !hasManualValue(h)).map((h) => h.ticker)),
  ];
  const priceRows = tickers.length
    ? await db
        .select()
        .from(schema.prices)
        .where(inArray(schema.prices.ticker, tickers))
    : [];

  // Group prices by ticker, sorted ascending by date — to scan "latest <= cutoff" linearly.
  const pricesByTicker = new Map<string, { date: string; close: number }[]>();
  for (const r of priceRows) {
    const list = pricesByTicker.get(r.ticker) ?? [];
    list.push({ date: r.date, close: r.close });
    pricesByTicker.set(r.ticker, list);
  }
  for (const list of pricesByTicker.values()) {
    list.sort((a, b) => a.date.localeCompare(b.date));
  }

  function priceAt(ticker: string, cutoffDate: string): number | null {
    const list = pricesByTicker.get(ticker);
    if (!list || list.length === 0) return null;
    let result: number | null = null;
    for (const p of list) {
      if (p.date <= cutoffDate) result = p.close;
      else break;
    }
    return result;
  }

  const accountById = new Map(accounts.map((a) => [a.id, a]));

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

    // Holdings valuation at this cutoff — current quantity × month-end price approximation.
    const cutoffDateStr = `${cutoff.getFullYear()}-${String(
      cutoff.getMonth() + 1
    ).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;
    for (const h of holdings) {
      const acct = accountById.get(h.accountId);
      if (!acct || !HOLDINGS_ACCOUNT_TYPES.has(acct.type)) continue;
      if (hasManualValue(h)) {
        add(h.accountId, h.manualValue as number);
        continue;
      }
      const close = priceAt(h.ticker, cutoffDateStr);
      if (close != null) add(h.accountId, h.quantity * close);
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
