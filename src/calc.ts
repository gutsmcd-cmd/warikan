export type RoundMode = 'up' | 'down' | 'nearest';
export interface Currency { code: string; symbol: string; decimals: number; units: number[] }
export const CURRENCIES: Currency[] = [
  { code: 'JPY', symbol: '¥', decimals: 0, units: [1, 10, 100] },
  { code: 'USD', symbol: '$', decimals: 2, units: [0.01, 0.1, 1] },
  { code: 'EUR', symbol: '€', decimals: 2, units: [0.01, 0.1, 1] },
  { code: 'GBP', symbol: '£', decimals: 2, units: [0.01, 0.1, 1] },
  { code: 'KRW', symbol: '₩', decimals: 0, units: [10, 100, 1000] },
  { code: 'TWD', symbol: 'NT$', decimals: 0, units: [1, 10, 100] },
  { code: 'CNY', symbol: 'CN¥', decimals: 2, units: [0.1, 1, 10] },
  { code: 'THB', symbol: '฿', decimals: 2, units: [1, 10, 100] },
  { code: 'AUD', symbol: 'A$', decimals: 2, units: [0.01, 0.1, 1] },
];
export const cur = (code: string) => CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];

/** Work in integer "minor units" to avoid float drift. */
export function roundTo(v: number, unit: number, mode: RoundMode, decimals: number): number {
  const f = 10 ** decimals;
  const u = Math.max(1, Math.round(unit * f));
  const minor = v * f;
  const eps = 1e-6;
  let q: number;
  if (mode === 'up') q = Math.ceil(minor / u - eps);
  else if (mode === 'down') q = Math.floor(minor / u + eps);
  else q = Math.round(minor / u);
  return (q * u) / f;
}

export interface Result { total: number; shares: number[]; collected: number; diff: number }
export function split(amount: number, tipPct: number, weights: number[], unit: number, mode: RoundMode, decimals: number): Result {
  const f = 10 ** decimals;
  const total = Math.round(amount * (1 + tipPct / 100) * f) / f;
  const sw = weights.reduce((a, b) => a + b, 0) || 1;
  const shares = weights.map((w) => roundTo((total * w) / sw, unit, mode, decimals));
  const collected = Math.round(shares.reduce((a, b) => a + b, 0) * f) / f;
  return { total, shares, collected, diff: Math.round((collected - total) * f) / f };
}

export function money(v: number, c: Currency, lang: string): string {
  const s = Math.abs(v).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US', { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals });
  return (v < 0 ? '−' : '') + c.symbol + s;
}
