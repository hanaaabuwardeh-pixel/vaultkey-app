// Client-side mirror of the pricing math the property-data edge function
// uses to validate a listing's price against ATTOM's market value. This
// module is for display/UX only -- the edge function independently
// recomputes and enforces these same rules server-side and never trusts
// anything computed here.

export const TIER_LABELS: Record<string, string> = {
  '10_percent': '10% Below — VaultKey Deal',
  '15_percent': '15% Below — Strong Deal',
  '20_percent': '20% Below — Hot Deal',
  custom: 'More than 20% Below — Exceptional Deal',
  pending_valuation: 'Pending independent valuation',
};

export const tierPriceCents = (marketValueCents: number, percent: number) =>
  Math.round((marketValueCents * (100 - percent)) / 100);

export const discountPercentOf = (marketValueCents: number, priceCents: number) =>
  marketValueCents > 0 ? Math.round(((marketValueCents - priceCents) / marketValueCents) * 10000) / 100 : 0;

export const dollarsToCents = (value: unknown) => {
  const amount = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
};

export const centsToDollarString = (cents: number) => String(Math.round(cents / 100));
