import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";

export type HoldingWithValuation = typeof schema.holdings.$inferSelect & {
  latestClose: number | null;
  latestPriceDate: string | null;
  marketValue: number;
  pnl: number | null;
  pnlPercent: number | null;
  currency: string;
};

export async function getHoldingsWithValuation(
  userId: string
): Promise<HoldingWithValuation[]> {
  const holdings = await db
    .select()
    .from(schema.holdings)
    .where(eq(schema.holdings.userId, userId))
    .orderBy(schema.holdings.ticker);

  if (holdings.length === 0) return [];

  const tickers = [...new Set(holdings.map((h) => h.ticker))];

  // Fetch all prices for these tickers in a single round-trip; pick latest per ticker in memory.
  const priceRows = await db
    .select()
    .from(schema.prices)
    .where(inArray(schema.prices.ticker, tickers));

  const latestPrices = new Map<
    string,
    { close: number; date: string; currency: string }
  >();
  for (const row of priceRows) {
    const existing = latestPrices.get(row.ticker);
    if (!existing || row.date > existing.date) {
      latestPrices.set(row.ticker, {
        close: row.close,
        date: row.date,
        currency: row.currency,
      });
    }
  }

  return holdings.map((h) => {
    const priceData = latestPrices.get(h.ticker);

    // 과거 버그로 manualValue 가 0 으로 저장된 행을 방어:
    // 양수일 때만 수동 평가액으로 인정하고, 그 외엔 시세/폴백 경로로 흐른다.
    const hasManualValue = h.manualValue != null && h.manualValue > 0;

    if (hasManualValue) {
      return {
        ...h,
        latestClose: null,
        latestPriceDate: null,
        marketValue: h.manualValue as number,
        pnl: null,
        pnlPercent: null,
        currency: "KRW",
      };
    }

    if (priceData) {
      const marketValue = h.quantity * priceData.close;
      const pnl = (priceData.close - h.avgBuyPrice) * h.quantity;
      const pnlPercent =
        h.avgBuyPrice !== 0
          ? ((priceData.close / h.avgBuyPrice) - 1) * 100
          : 0;
      return {
        ...h,
        latestClose: priceData.close,
        latestPriceDate: priceData.date,
        marketValue,
        pnl,
        pnlPercent,
        currency: priceData.currency,
      };
    }

    // No price, no manualValue: conservative fallback
    return {
      ...h,
      latestClose: null,
      latestPriceDate: null,
      marketValue: h.quantity * h.avgBuyPrice,
      pnl: 0,
      pnlPercent: 0,
      currency: "KRW",
    };
  });
}
