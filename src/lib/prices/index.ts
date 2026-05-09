import type { AssetClass } from '@/db/schema';
import * as krx from './adapters/krx';
import * as yfinance from './adapters/yfinance';
import * as coingecko from './adapters/coingecko';

export type { PriceQuote } from './adapters/krx';

export async function fetchPriceFor(
  holding: { ticker: string; assetClass: AssetClass },
  opts?: { signal?: AbortSignal }
): Promise<krx.PriceQuote> {
  switch (holding.assetClass) {
    case 'stock_kr':
      return krx.fetch(holding.ticker, opts);
    case 'stock_us':
    case 'etf':
      return yfinance.fetch(holding.ticker, opts);
    case 'crypto':
      return coingecko.fetch(holding.ticker, opts);
    default:
      throw new Error(`fetchPriceFor: unsupported assetClass "${holding.assetClass}"`);
  }
}
