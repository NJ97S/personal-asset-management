import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getHoldingsWithValuation } from "./holdings-valuation";

export type AccountWithBalance = typeof schema.accounts.$inferSelect & {
  balance: number;
};

const LIABILITY_TYPES = new Set<typeof schema.accountTypeEnum[number]>([
  "credit_card",
  "loan",
]);

/**
 * 모든 계정의 현재 잔액을 한 번의 쿼리로 계산.
 *
 * 단순 거래(income/expense): account_id 의 잔액에 +/-
 * 이체(transfer): fromAccountId 에서 -, toAccountId 에 +
 * 주식 거래(trade): tradeKind=buy → account_id 에서 -, sell → + (현금 영향만)
 *
 * 종목 평가금액(holdings × prices) 은 별도 단계에서 합산.
 * trade 의 amount 는 createTransaction 액션에서 현금 영향(quantity × price + fee) 이 들어왔다고 가정.
 */
export async function computeAccountBalances(
  userId: string
): Promise<AccountWithBalance[]> {
  const [accounts, txs] = await Promise.all([
    db.select().from(schema.accounts).where(eq(schema.accounts.userId, userId)),
    db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userId)),
  ]);

  const balances = new Map<string, number>();
  for (const a of accounts) balances.set(a.id, a.initialBalance);

  const add = (id: string | null | undefined, delta: number) => {
    if (!id) return;
    balances.set(id, (balances.get(id) ?? 0) + delta);
  };

  for (const t of txs) {
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

  return accounts.map((a) => ({
    ...a,
    balance: balances.get(a.id) ?? a.initialBalance,
  }));
}

export interface NetWorthSummary {
  assets: number;
  liabilities: number;
  netWorth: number;
  accounts: AccountWithBalance[];
}

export async function computeNetWorth(userId: string): Promise<NetWorthSummary> {
  const accounts = await computeAccountBalances(userId);
  let assets = 0;
  let liabilities = 0;
  for (const a of accounts) {
    if (a.isArchived) continue;
    if (LIABILITY_TYPES.has(a.type)) {
      // 카드/대출의 잔액이 음수(쓴 돈)면 절댓값을 부채로.
      liabilities += Math.max(0, -a.balance);
      // 잔액이 +면 사용 가능 한도(자산 아님). 부채만 카운트.
    } else {
      assets += a.balance;
    }
  }
  return { assets, liabilities, netWorth: assets - liabilities, accounts };
}

export function isLiabilityAccount(
  type: typeof schema.accountTypeEnum[number]
): boolean {
  return LIABILITY_TYPES.has(type);
}

const HOLDINGS_ACCOUNT_TYPES = new Set<typeof schema.accountTypeEnum[number]>([
  "stock",
  "crypto",
]);

export async function computeAccountBalancesWithHoldings(
  userId: string
): Promise<AccountWithBalance[]> {
  const [accounts, holdingsValuation] = await Promise.all([
    computeAccountBalances(userId),
    getHoldingsWithValuation(userId),
  ]);

  // Sum holdings marketValue per accountId
  const holdingsByAccount = new Map<string, number>();
  for (const h of holdingsValuation) {
    holdingsByAccount.set(
      h.accountId,
      (holdingsByAccount.get(h.accountId) ?? 0) + h.marketValue
    );
  }

  return accounts.map((a) => {
    if (!HOLDINGS_ACCOUNT_TYPES.has(a.type)) return a;
    const holdingsTotal = holdingsByAccount.get(a.id) ?? 0;
    return { ...a, balance: a.balance + holdingsTotal };
  });
}

export async function computeNetWorthWithHoldings(
  userId: string
): Promise<NetWorthSummary> {
  const accounts = await computeAccountBalancesWithHoldings(userId);
  let assets = 0;
  let liabilities = 0;
  for (const a of accounts) {
    if (a.isArchived) continue;
    if (LIABILITY_TYPES.has(a.type)) {
      liabilities += Math.max(0, -a.balance);
    } else {
      assets += a.balance;
    }
  }
  return { assets, liabilities, netWorth: assets - liabilities, accounts };
}
