export interface PriceQuote {
  close: number;
  currency: 'KRW' | 'USD';
  asOf: string;
}

const COIN_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  SOL: 'solana',
  XRP: 'ripple',
  DOGE: 'dogecoin',
  ADA: 'cardano',
  BNB: 'binancecoin',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
};

export async function fetch(
  ticker: string,
  opts?: { signal?: AbortSignal }
): Promise<PriceQuote> {
  const coinId = COIN_ID_MAP[ticker.toUpperCase()];
  if (!coinId) {
    throw new Error(`coingecko: unmapped ticker "${ticker}"`);
  }
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
  const res = await globalThis.fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AssetMgmt/1.0)' },
    signal: opts?.signal,
  });
  if (!res.ok) {
    throw new Error(`coingecko fetch failed: HTTP ${res.status} for ${ticker}`);
  }
  const data = await res.json() as Record<string, { usd: number }>;
  const close = data[coinId]?.usd;
  if (close == null || isNaN(close)) {
    throw new Error(`coingecko: no price returned for ${ticker} (${coinId})`);
  }
  const asOf = new Date().toISOString();
  return { close, currency: 'USD', asOf };
}
