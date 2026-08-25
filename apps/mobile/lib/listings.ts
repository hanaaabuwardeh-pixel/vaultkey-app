import { supabase } from '@/lib/supabase';

export type ListingDraftPayload = Record<string, string | boolean>;

export type MyListing = {
  id: string;
  asset_class: 'residential' | 'multifamily' | 'commercial' | 'land' | 'business';
  subtype: string;
  title: string;
  city: string;
  state: string;
  asking_price_cents: number;
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

const priceInCents = (value: unknown) => {
  const amount = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid asking price.');
  return Math.round(amount * 100);
};

export const submitListing = async (
  asset: string,
  payload: ListingDraftPayload,
  draftId: string | null,
) => {
  const user = await requireUser();
  const assetClass = asset.toLowerCase();
  const allowed = ['residential', 'multifamily', 'commercial', 'land', 'business'];
  if (!allowed.includes(assetClass)) throw new Error('Choose a valid asset class.');

  const assetDetails = {
    ...payload,
    google: {
      latitude: payload.latitude || null,
      longitude: payload.longitude || null,
    },
    attom: {
      matched: Boolean(payload.attomMatched),
      property: payload.attomProperty ? JSON.parse(String(payload.attomProperty)) : null,
    },
  };

  const { data, error } = await supabase!
    .from('listings')
    .insert({
      owner_id: user.id,
      asset_class: assetClass,
      subtype: String(payload.type),
      title: String(payload.address || `${payload.city}, ${payload.state}`),
      description: String(payload.description || ''),
      city: String(payload.city),
      state: String(payload.state),
      postal_code: String(payload.zip || ''),
      exact_address: String(payload.address || ''),
      hide_exact_address: Boolean(payload.hideAddress),
      asking_price_cents: priceInCents(payload.askingPrice),
      status: 'submitted',
      asset_details: assetDetails,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  if (draftId) {
    await supabase!.from('listing_drafts').delete().eq('id', draftId);
  }

  return data.id as string;
};

export const getMyListings = async (): Promise<MyListing[]> => {
  const user = await requireUser();
  const { data, error } = await supabase!
    .from('listings')
    .select('id,asset_class,subtype,title,city,state,asking_price_cents,status,asset_details,created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as MyListing[];
};
