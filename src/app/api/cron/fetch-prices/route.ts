import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { fetchPriceFor } from '@/lib/prices';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  if (!isVercelCron && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const holdings = await db.select().from(schema.holdings);
  const targets = holdings.filter((h) => h.manualValue == null);

  let ok = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const h of targets) {
    try {
      const q = await fetchPriceFor(h);
      const dateStr = q.asOf.slice(0, 10);
      await db
        .insert(schema.prices)
        .values({ ticker: h.ticker, date: dateStr, close: q.close, currency: q.currency })
        .onConflictDoUpdate({
          target: [schema.prices.ticker, schema.prices.date],
          set: { close: q.close, currency: q.currency },
        });
      await db
        .update(schema.holdings)
        .set({ lastPricedAt: new Date() })
        .where(eq(schema.holdings.id, h.id));
      ok++;
    } catch (e) {
      failed++;
      errors.push(`${h.ticker}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ ok, failed, errors, at: new Date().toISOString() });
}
