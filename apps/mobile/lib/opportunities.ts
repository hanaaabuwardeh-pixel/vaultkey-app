export type AssetClass = 'Residential' | 'Multifamily' | 'Commercial' | 'Land' | 'Business';

export type Opportunity = {
  id: string;
  assetClass: AssetClass;
  subtype: string;
  title: string;
  location: string;
  askingPrice: number;
  marketValue: number;
  discount: number;
  upside: number;
  strategy: string;
  condition: string;
  summary: string;
  metrics: Array<{ label: string; value: string }>;
  verified: boolean;
  accessRequired: boolean;
  // Undefined/true for opportunities with a real independent valuation.
  // Explicitly false marks a listing still awaiting ATTOM AVM data, so its
  // card can show that instead of a fabricated 0% / $0.
  hasIndependentValuation?: boolean;
  // Server-computed pricing tier ('10_percent'/'15_percent'/'20_percent'/
  // 'custom'/'pending_valuation'), see lib/pricing.ts TIER_LABELS.
  pricingTier?: string | null;
};

export const opportunities: Opportunity[] = [
  {
    id: 'west-plano-residence', assetClass: 'Residential', subtype: 'Single-Family', title: 'West Plano Residence', location: 'West Plano, TX',
    askingPrice: 610000, marketValue: 760000, discount: 20, upside: 150000, strategy: 'Buy & Hold', condition: 'Light Updates', verified: true, accessRequired: true,
    summary: 'Off-market single-family home with strong comps, a practical layout, and value-add potential in an established Plano neighborhood.',
    metrics: [{ label: 'Beds', value: '4' }, { label: 'Baths', value: '3' }, { label: 'Living Area', value: '2,450 sq ft' }, { label: 'Year Built', value: '2005' }],
  },
  {
    id: 'plano-quadplex', assetClass: 'Multifamily', subtype: '2–4 Unit', title: 'Plano Quadplex', location: 'Plano, TX',
    askingPrice: 675000, marketValue: 790000, discount: 15, upside: 115000, strategy: 'Buy & Hold', condition: 'Good', verified: true, accessRequired: true,
    summary: 'Four-unit opportunity with stable occupancy and room to improve rents at renewal.',
    metrics: [{ label: 'Units', value: '4' }, { label: 'Occupancy', value: '92%' }, { label: 'NOI', value: '$58,400' }, { label: 'Cap Rate', value: '8.7%' }],
  },
  {
    id: 'addison-office', assetClass: 'Commercial', subtype: 'Office', title: 'Addison Office Building', location: 'Addison, TX',
    askingPrice: 2100000, marketValue: 2500000, discount: 16, upside: 400000, strategy: 'Value Add', condition: 'Good', verified: true, accessRequired: true,
    summary: 'Well-located office asset with existing income and upside through lease-up and operational improvements.',
    metrics: [{ label: 'Building Area', value: '18,500 sq ft' }, { label: 'Occupancy', value: '81%' }, { label: 'NOI', value: '$186,000' }, { label: 'Cap Rate', value: '8.9%' }],
  },
  {
    id: 'frisco-land', assetClass: 'Land', subtype: 'Development Land', title: 'Frisco Development Site', location: 'Frisco, TX',
    askingPrice: 1450000, marketValue: 1750000, discount: 17, upside: 300000, strategy: 'Development', condition: 'Shovel Ready', verified: true, accessRequired: true,
    summary: 'Entitled development parcel near expanding residential and commercial corridors.',
    metrics: [{ label: 'Size', value: '15.2 acres' }, { label: 'Zoning', value: 'PD' }, { label: 'Utilities', value: 'Available' }, { label: 'Status', value: 'Shovel Ready' }],
  },
  {
    id: 'dallas-restaurant', assetClass: 'Business', subtype: 'Restaurant', title: 'Dallas Restaurant Business', location: 'Dallas, TX',
    askingPrice: 925000, marketValue: 1150000, discount: 20, upside: 225000, strategy: 'Owner-Operator', condition: 'Operating', verified: true, accessRequired: true,
    summary: 'Established restaurant operation with documented revenue, trained staff, and equipment included.',
    metrics: [{ label: 'Annual Revenue', value: '$1.25M' }, { label: 'SDE', value: '$310,000' }, { label: 'Inventory', value: 'Included' }, { label: 'Years Operating', value: '11' }],
  },
];

export const money = (value: number) => `$${value.toLocaleString('en-US')}`;

export function findOpportunity(id?: string) {
  return opportunities.find((item) => item.id === id) ?? opportunities[0];
}

