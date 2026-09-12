import { supabase } from '@/lib/supabase';
import { invokePropertyData } from '@/lib/propertyData';

export type ListingDraftPayload = Record<string, string | boolean>;

export type MyListing = {
  id: string;
  asset_class: 'residential' | 'multifamily' | 'commercial' | 'land' | 'business';
  subtype: string;
  title: string;
  city: string;
  state: string;
  asking_price_cents: number;
  market_value_cents: number | null;
  discount_cents: number | null;
  discount_percent: number | null;
  pricing_tier: string | null;
  status: string;
  asset_details: Record<string, unknown>;
  created_at: string;
};

const requireUser = async () => {
  if (!supabase) throw new Error('VaultKey is not connected to Supabase.');
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Sign in before saving a listing.');
  return data.user;
};

export const saveListingDraft = async (
  id: string | null,
  payload: ListingDraftPayload,
  currentStep: number,
) => {
  const user = await requireUser();
  const record = {
    owner_id: user.id,
    payload,
    current_step: currentStep,
    updated_at: new Date().toISOString(),
  };

  const query = id
    ? supabase!.from('listing_drafts').update(record).eq('id', id).select('id').single()
    : supabase!.from('listing_drafts').insert(record).select('id').single();

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.id as string;
};

const parseJsonArray = (value: unknown): unknown[] => {
  try {
    const parsed = JSON.parse(String(value ?? '[]'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const submitListing = async (
  asset: string,
  payload: ListingDraftPayload,
  draftId: string | null,
) => {
  if (!supabase) throw new Error('VaultKey is not connected to Supabase.');
  await requireUser(); // fail fast locally; the edge function re-verifies the session itself

  const assetClass = asset.toLowerCase();
  const allowed = ['residential', 'multifamily', 'commercial', 'land', 'business'];
  if (!allowed.includes(assetClass)) throw new Error('Choose a valid asset class.');

  // The seller's asking price, pricing tier, and any dispute evidence are
  // only a proposal here -- the edge function independently re-fetches
  // the ATTOM/LightBox value, re-verifies every uploaded document against
  // Supabase Storage, and validates the price before writing anything.
  // Nothing this client sends is trusted on its own.
  const data = await invokePropertyData<{ id: string }>({
    action: 'submit',
    assetClass,
    draftId,
    proofDocuments: parseJsonArray(payload.proofDocuments),
    subtype: String(payload.type ?? ''),
    description: String(payload.description ?? ''),
    address: String(payload.address ?? ''),
    city: String(payload.city ?? ''),
    state: String(payload.state ?? ''),
    zip: String(payload.zip ?? ''),
    hideAddress: Boolean(payload.hideAddress),
    askingPrice: payload.askingPrice,
    pricingTier: payload.pricingTier,
    latitude: payload.latitude,
    longitude: payload.longitude,
    attomMatched: payload.attomMatched,
    attomProperty: payload.attomProperty,
    valuationDisputed: Boolean(payload.valuationDisputed),
    disputeEvidenceType: String(payload.disputeEvidenceType ?? ''),
    disputeDocuments: parseJsonArray(payload.disputeDocuments),
    disputeNote: String(payload.disputeNote ?? ''),
    assetDetails: payload,
  });

  if (draftId) {
    await supabase.from('listing_drafts').delete().eq('id', draftId);
  }

  return data.id as string;
};

export const getMyListings = async (): Promise<MyListing[]> => {
  const user = await requireUser();
  const { data, error } = await supabase!
    .from('listings')
    .select('id,asset_class,subtype,title,city,state,asking_price_cents,market_value_cents,discount_cents,discount_percent,pricing_tier,status,asset_details,created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as MyListing[];
};
