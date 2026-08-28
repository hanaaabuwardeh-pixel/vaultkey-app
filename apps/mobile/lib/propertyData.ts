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

const invoke = async <T>(body: Record<string, unknown>): Promise<T> => {
  if (!supabase) throw new Error('VaultKey is not connected to Supabase.');

  const { data, error } = await supabase.functions.invoke('property-data', { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as T;
};

export const searchAddresses = async (input: string) => {
  const data = await invoke<{ suggestions: AddressSuggestion[] }>({
    action: 'autocomplete',
    input,
  });
  return data.suggestions;
};

export const getPropertyData = async (placeId: string, description: string) =>
  invoke<{
    address: VerifiedAddress;
    attomMatched: boolean;
    property: Record<string, unknown> | null;
    valuation: AttomValuation | null;
  }>({
    action: 'details',
    placeId,
    description,
  });
