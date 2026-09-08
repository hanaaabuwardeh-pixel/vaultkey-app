import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type AddressSuggestion = {
  placeId: string;
  description: string;
};

export type AttomValuation = {
  provider: string;
  methodology: string;
  value: number;
  low: number | null;
  high: number | null;
  confidence: number | null;
  eventDate: string | null;
  providerReference: string | number | null;
};

export type VerifiedAddress = {
  street: string;
  city: string;
  state: string;
  zip: string;
  formattedAddress: string;
  latitude: number | null;
  longitude: number | null;
};

// supabase-js only sets `error.message` to a generic "non-2xx status code"
// string on a FunctionsHttpError -- the actual { error: "..." } body our
// edge function returns lives on `error.context` (the raw Response) and
// has to be parsed out explicitly, or every specific error message the
// function returns (bad address, invalid price, ATTOM/Google failures,
// pricing-tier rejections) is silently replaced with that generic string.
export const invokePropertyData = async <T>(body: Record<string, unknown>): Promise<T> => {
  if (!supabase) throw new Error('VaultKey is not connected to Supabase.');

  const { data, error } = await supabase.functions.invoke('property-data', { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const parsed = await error.context.json().catch(() => null);
      throw new Error(parsed?.error || error.message);
    }
    throw new Error(error.message);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
};

export const searchAddresses = async (input: string) => {
  const data = await invokePropertyData<{ suggestions: AddressSuggestion[] }>({
    action: 'autocomplete',
    input,
  });
  return data.suggestions;
};

export const getPropertyData = async (placeId: string, description: string) =>
  invokePropertyData<{
    address: VerifiedAddress;
    attomMatched: boolean;
    property: Record<string, unknown> | null;
    valuation: AttomValuation | null;
  }>({
    action: 'details',
    placeId,
    description,
  });
