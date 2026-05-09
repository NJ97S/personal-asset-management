export interface PriceQuote {
  close: number;
  currency: 'KRW' | 'USD';
  asOf: string;
}

export async function fetch(
  ticker: string,
  opts?: { signal?: AbortSignal }
): Promise<PriceQuote> {
  const url = `https://api.finance.naver.com/service/itemSummary.nhn?itemcode=${encodeURIComponent(ticker)}`;
  const res = await globalThis.fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AssetMgmt/1.0)' },
    signal: opts?.signal,
  });
  if (!res.ok) {
    throw new Error(`KRX fetch failed: HTTP ${res.status} for ${ticker}`);
  }
  const data = await res.json() as Record<string, unknown>;
  const close = Number(data.now ?? data.closePrice ?? data.close);
  if (!close || isNaN(close)) {
    throw new Error(`KRX adapter: no valid price in response for ${ticker}`);
  }
  const asOf = new Date().toISOString();
  return { close, currency: 'KRW', asOf };
}
