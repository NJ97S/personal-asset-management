export interface PriceQuote {
  close: number;
  currency: 'KRW' | 'USD';
  asOf: string;
}

export async function fetch(
  ticker: string,
  opts?: { signal?: AbortSignal }
): Promise<PriceQuote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=5d&interval=1d`;
  const res = await globalThis.fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AssetMgmt/1.0)' },
    signal: opts?.signal,
  });
  if (!res.ok) {
    throw new Error(`yfinance fetch failed: HTTP ${res.status} for ${ticker}`);
  }
  const data = await res.json() as {
    chart: {
      result: Array<{
        meta: { regularMarketPrice: number; currency: string };
        indicators: { quote: Array<{ close: (number | null)[] }> };
      }> | null;
      error: { description: string } | null;
    };
  };
  if (data.chart.error) {
    throw new Error(`yfinance error for ${ticker}: ${data.chart.error.description}`);
  }
  const result = data.chart.result?.[0];
  if (!result) {
    throw new Error(`yfinance: no result for ${ticker}`);
  }
  const close =
    result.meta.regularMarketPrice ??
    result.indicators.quote[0]?.close.filter((v): v is number => v !== null).at(-1);
  if (close == null || isNaN(close)) {
    throw new Error(`yfinance: no valid close price for ${ticker}`);
  }
  const rawCurrency = result.meta.currency?.toUpperCase();
  const currency: 'KRW' | 'USD' = rawCurrency === 'KRW' ? 'KRW' : 'USD';
  const asOf = new Date().toISOString();
  return { close, currency, asOf };
}
