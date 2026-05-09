import { eq, desc } from "drizzle-orm";
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

  // Fetch latest price for each ticker
  const latestPrices = new Map<
    string,
    { close: number; date: string; currency: string }
  >();

  await Promise.all(
    tickers.map(async (ticker) => {
      const rows = await db
        .select()
        .from(schema.prices)
        .where(eq(schema.prices.ticker, ticker))
        .orderBy(desc(schema.prices.date))
        .limit(1);
      if (rows.length > 0) {
        latestPrices.set(ticker, {
          close: rows[0].close,
          date: rows[0].date,
          currency: rows[0].currency,
        });
      }
    })
  );

  return holdings.map((h) => {
    const priceData = latestPrices.get(h.ticker);

    if (h.manualValue != null) {
      return {
        ...h,
        latestClose: null,
        latestPriceDate: null,
        marketValue: h.manualValue,
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
