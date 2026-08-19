export type AssetClass = 'residential' | 'multifamily' | 'commercial' | 'land' | 'business';
export type UserRole = 'buyer' | 'seller' | 'agent' | 'admin' | 'analyst';
export type QualificationStatus = 'pending' | 'qualified' | 'does_not_qualify' | 'low_confidence' | 'appraisal_required' | 'disputed';
export type ListingStatus = 'draft' | 'submitted' | 'under_review' | 'changes_required' | 'rejected' | 'approved' | 'published' | 'paused' | 'sold' | 'archived';

export interface Opportunity {
  id: string;
  assetClass: AssetClass;
  subtype: string;
  title: string;
  city: string;
  state: string;
  askingPriceCents: number;
  marketValueCents?: number;
  qualificationStatus: QualificationStatus;
  listingStatus: ListingStatus;
}
