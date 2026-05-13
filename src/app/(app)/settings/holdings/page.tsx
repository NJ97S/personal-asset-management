import { TopNav } from "@/components/nav/top-nav";
import { HoldingManager } from "@/components/forms/holding-manager";
import { getSession } from "@/lib/auth";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { getHoldingsWithValuation } from "@/lib/queries/holdings-valuation";

export const dynamic = "force-dynamic";

export default async function HoldingsSettingsPage() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const [holdings, accounts] = await Promise.all([
    getHoldingsWithValuation(session.user.id),
    db
      .select()
      .from(schema.accounts)
      .where(
        and(
          eq(schema.accounts.userId, session.user.id),
          eq(schema.accounts.isArchived, false)
        )
      ),
  ]);

  return (
    <>
      <TopNav title="보유 종목" back="/settings" />
      <div className="p-4">
        <HoldingManager
          holdings={holdings.map((h) => ({
            id: h.id,
            accountId: h.accountId,
            ticker: h.ticker,
            name: h.name,
            exchange: h.exchange,
            assetClass: h.assetClass,
            quantity: h.quantity,
            avgBuyPrice: h.avgBuyPrice,
            manualValue: h.manualValue,
            latestClose: h.latestClose,
            latestPriceDate: h.latestPriceDate,
            marketValue: h.marketValue,
            pnl: h.pnl,
            pnlPercent: h.pnlPercent,
            currency: h.currency,
          }))}
          accounts={accounts.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
          }))}
        />
      </div>
    </>
  );
}
