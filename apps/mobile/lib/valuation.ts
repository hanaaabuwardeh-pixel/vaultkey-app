export type AssetClass = 'Residential' | 'Multifamily' | 'Commercial' | 'Land' | 'Business';

export type ProofRequirement = {
  category: string;
  label: string;
  reason: string;
};

export const PROOF_REQUIREMENTS: Record<AssetClass, ProofRequirement[]> = {
  Residential: [],
  Multifamily: [
    { category: 'rent_roll', label: 'Current rent roll', reason: 'Supports units, rents, occupancy, and unit mix.' },
    { category: 'operating_statement', label: 'Trailing 12-month operating statement', reason: 'Supports the annual NOI.' },
  ],
  Commercial: [
    { category: 'lease_summary', label: 'Leases or certified lease summary', reason: 'Supports tenancy and occupied income.' },
    { category: 'operating_statement', label: 'Trailing 12-month operating statement', reason: 'Supports the annual NOI.' },
  ],
  Land: [
    { category: 'survey', label: 'Survey or recorded plat', reason: 'Supports acreage and usable site area.' },
    { category: 'valuation_support', label: 'Appraisal, CMA, or land-sales comparison', reason: 'Supports the price-per-acre assumption.' },
    { category: 'zoning', label: 'Zoning or entitlement documentation', reason: 'Supports permitted use and development status.' },
  ],
  Business: [
    { category: 'profit_loss', label: 'Year-to-date and prior-year profit & loss statements', reason: 'Supports revenue, cash flow, and SDE.' },
    { category: 'tax_return', label: 'Most recent business tax return', reason: 'Confirms reported financial performance.' },
  ],
};

export const sellerValuation = (asset: AssetClass, draft: Record<string, string | boolean>) => {
  const number = (key: string) => Number(String(draft[key] ?? '').replace(/[^0-9.]/g, '')) || 0;
  if (asset === 'Multifamily' || asset === 'Commercial') {
    const noi = number('noi');
    const capRate = number('capRate');
    return noi > 0 && capRate > 0 ? noi / (capRate / 100) : 0;
  }
  if (asset === 'Land') {
    const acres = number('acres');
    const pricePerAcre = number('pricePerAcre');
    return acres > 0 && pricePerAcre > 0 ? acres * pricePerAcre : 0;
  }
  if (asset === 'Business') {
    const sde = number('sde');
    const multiple = number('valuationMultiple');
    return sde > 0 && multiple > 0 ? sde * multiple : 0;
  }
  return number('marketValue');
};
