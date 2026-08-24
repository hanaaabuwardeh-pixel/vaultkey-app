export type AssetClass =
  | 'residential'
  | 'multifamily'
  | 'commercial'
  | 'land'
  | 'business';

export type QualificationStatus =
  | 'qualified'
  | 'does_not_qualify'
  | 'low_confidence'
  | 'appraisal_required';

export type ValuationTier =
  | 'vault_pick'
  | 'qualified'
  | 'not_qualified'
  | 'low_confidence'
  | 'appraisal_required';

export interface ValuationEstimate {
  provider: string;
  methodology: string;
  marketValueCents: number;
  confidence: number;
  evidence?: Record<string, unknown>;
}

export interface ValuationDecision {
  conservativeValueCents: number;
  medianValueCents: number;
  sourceCount: number;
  confidence: number;
  discountPercent: number;
  tier: ValuationTier;
  qualificationStatus: QualificationStatus;
  reasons: string[];
}

export const QUALIFY_DISCOUNT_PERCENT = 15;
export const VAULT_PICK_DISCOUNT_PERCENT = 20;
export const MIN_CONFIDENCE = 70;
export const DEFAULT_REQUIRED_SOURCES = 2;

const round = (value: number, places = 2) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

export function decideQualification(
  askingPriceCents: number,
  estimates: ValuationEstimate[],
  requiredSourceCount = DEFAULT_REQUIRED_SOURCES,
): ValuationDecision {
  if (!Number.isFinite(askingPriceCents) || askingPriceCents <= 0) {
    throw new Error('A valid asking price is required.');
  }

  const valid = estimates.filter(
    (estimate) =>
      Number.isFinite(estimate.marketValueCents) &&
      estimate.marketValueCents > 0 &&
      Number.isFinite(estimate.confidence) &&
      estimate.confidence >= 0 &&
      estimate.confidence <= 100,
  );

  if (valid.length === 0) {
    return {
      conservativeValueCents: 0,
      medianValueCents: 0,
      sourceCount: 0,
      confidence: 0,
      discountPercent: 0,
      tier: 'appraisal_required',
      qualificationStatus: 'appraisal_required',
      reasons: ['No independent valuation source returned a usable result.'],
    };
  }

  const values = valid.map((estimate) => estimate.marketValueCents);
  const medianValueCents = median(values);
  // VaultKey never uses the seller's claimed value. The lower independent result
  // is used when only two sources exist; larger sets use the lower quartile.
  const sorted = [...values].sort((a, b) => a - b);
  const conservativeIndex = Math.max(0, Math.floor((sorted.length - 1) * 0.25));
  const conservativeValueCents = sorted[conservativeIndex];

  const averageConfidence =
    valid.reduce((sum, estimate) => sum + estimate.confidence, 0) / valid.length;
  const spread =
    (Math.max(...values) - Math.min(...values)) / Math.max(medianValueCents, 1);
  const confidence = round(Math.max(0, averageConfidence - Math.min(30, spread * 100)));

  const discountPercent = round(
    ((conservativeValueCents - askingPriceCents) / conservativeValueCents) * 100,
  );

  if (valid.length < requiredSourceCount || confidence < MIN_CONFIDENCE) {
    return {
      conservativeValueCents,
      medianValueCents,
      sourceCount: valid.length,
      confidence,
      discountPercent,
      tier: 'low_confidence',
      qualificationStatus: 'low_confidence',
      reasons: [
        valid.length < requiredSourceCount
          ? `At least ${requiredSourceCount} independent sources are required.`
          : 'Independent sources disagree too much or have weak confidence.',
      ],
    };
  }

  if (discountPercent >= VAULT_PICK_DISCOUNT_PERCENT) {
    return {
      conservativeValueCents,
      medianValueCents,
      sourceCount: valid.length,
      confidence,
      discountPercent,
      tier: 'vault_pick',
      qualificationStatus: 'qualified',
      reasons: ['Verified at least 20% below the conservative independent value.'],
    };
  }

  if (discountPercent >= QUALIFY_DISCOUNT_PERCENT) {
    return {
      conservativeValueCents,
      medianValueCents,
      sourceCount: valid.length,
      confidence,
      discountPercent,
      tier: 'qualified',
      qualificationStatus: 'qualified',
      reasons: ['Verified at least 15% below the conservative independent value.'],
    };
  }

  return {
    conservativeValueCents,
    medianValueCents,
    sourceCount: valid.length,
    confidence,
    discountPercent,
    tier: 'not_qualified',
    qualificationStatus: 'does_not_qualify',
    reasons: ['The asking price is not at least 15% below independent value.'],
  };
}
