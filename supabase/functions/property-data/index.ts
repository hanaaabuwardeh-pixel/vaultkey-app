import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`;

type GoogleComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

const component = (parts: GoogleComponent[] = [], type: string, short = false) => {
  const match = parts.find((part) => part.types?.includes(type));
  return short ? match?.shortText ?? '' : match?.longText ?? '';
};

type AvmValuation = {
  provider: string;
  methodology: string;
  value: number;
  low: number | null;
  high: number | null;
  confidence: number | null;
  eventDate: string | null;
  providerReference: string | number | null;
};

// attomavm/detail and avm/snapshot are both ATTOM-ID-keyed lookups: they
// need `attomid` (lowercase, matching ATTOM's own query parameter
// convention), not an address1/address2 search. avm/detail is the one AVM
// endpoint that genuinely accepts address1/address2, so it's kept as an
// address-based fallback when no ATTOM ID is known. Shared by both the
// `details` and `submit` actions so there is exactly one AVM lookup
// implementation.
async function fetchAvmValuation(
  attomKey: string,
  addressParams: URLSearchParams,
  attomId: string | number | null,
): Promise<AvmValuation | null> {
  const avmRequests = [
    ...(attomId
      ? [{ endpoint: 'attomavm/detail', params: new URLSearchParams({ attomid: String(attomId) }) }]
      : []),
    { endpoint: 'avm/detail', params: addressParams },
    ...(attomId
      ? [{ endpoint: 'avm/snapshot', params: new URLSearchParams({ attomid: String(attomId) }) }]
      : []),
  ];

  for (const avmRequest of avmRequests) {
    const avmResponse = await fetch(
      `https://api.gateway.attomdata.com/propertyapi/v1.0.0/${avmRequest.endpoint}?${avmRequest.params}`,
      {
        headers: {
          Accept: 'application/json',
          APIKey: attomKey,
        },
      },
    );
    const avmPayload = await avmResponse.json().catch(() => null);
    const avmProperty = avmPayload?.property?.[0] ?? null;
    const amount = avmProperty?.avm?.amount ?? {};
    const value = Number(amount.value);

    if (avmResponse.ok && Number.isFinite(value) && value > 0) {
      return {
        provider: 'ATTOM',
        methodology: avmRequest.endpoint === 'attomavm/detail' ? 'ATTOM Cascaded AVM' : 'ATTOM AVM',
        value,
        low: Number(amount.low) || null,
        high: Number(amount.high) || null,
        confidence: Number(amount.scr) || null,
        eventDate: avmProperty?.avm?.eventDate ?? null,
        providerReference:
          avmProperty?.identifier?.attomId ??
          avmProperty?.identifier?.obPropId ??
          null,
      };
    }

    console.warn(
      'ATTOM AVM unavailable',
      avmRequest.endpoint,
      avmResponse.status,
      avmPayload?.status?.msg ?? 'Unknown response',
    );
  }

  return null;
}

// The four allowed seller pricing tiers. 10/15/20 must land within a cent
// of the exact tier price (currency-safe rounding, not float equality);
// custom must be strictly below the 20% price -- 20% itself is only
// reachable through the "20" tier, never through "custom".
const TIER_FRACTIONS = { '5': 5, '10': 10, '15': 15, '20': 20 } as const;
const TOLERANCE_CENTS = 1;

const tierPriceCents = (marketValueCents: number, percent: number) =>
  Math.round((marketValueCents * (100 - percent)) / 100);

function validatePricing(
  marketValueCents: number,
  askingPriceCents: number,
  requestedTier: string,
): { ok: true; tier: string; discountCents: number; discountPercent: number } | { ok: false; error: string } {
  if (askingPriceCents >= marketValueCents) {
    return { ok: false, error: "The asking price must be below VaultKey's estimated market value." };
  }

  const tier20Cents = tierPriceCents(marketValueCents, 20);

  for (const [key, percent] of Object.entries(TIER_FRACTIONS)) {
    if (requestedTier === key) {
      const targetCents = tierPriceCents(marketValueCents, percent);
      if (Math.abs(askingPriceCents - targetCents) > TOLERANCE_CENTS) {
        return { ok: false, error: `The ${percent}% below market price is ${money(targetCents)}.` };
      }
      const discountCents = marketValueCents - askingPriceCents;
      const discountPercent = Math.round((discountCents / marketValueCents) * 10000) / 100;
      return { ok: true, tier: `${percent}_percent`, discountCents, discountPercent };
    }
  }

  if (requestedTier === 'custom') {
    if (askingPriceCents >= tier20Cents - TOLERANCE_CENTS) {
      return {
        ok: false,
        error:
          "Custom pricing is available for sellers who want to price more than 20% below VaultKey's estimated market value. " +
          `Choose the 10%, 15%, or 20% option above, or enter a price below ${money(tier20Cents)}.`,
      };
    }
    const discountCents = marketValueCents - askingPriceCents;
    const discountPercent = Math.round((discountCents / marketValueCents) * 10000) / 100;
    return { ok: true, tier: 'custom', discountCents, discountPercent };
  }

  return { ok: false, error: 'Choose a pricing tier (5%, 10%, 15%, 20%, or Custom).' };
}


const REQUIRED_PROOFS: Record<string, string[]> = {
  multifamily: ['rent_roll', 'operating_statement'],
  commercial: ['lease_summary', 'operating_statement'],
  land: ['survey', 'valuation_support', 'zoning'],
  business: ['profit_loss', 'tax_return'],
};

const numeric = (value: unknown) =>
  Number(String(value ?? '').replace(/[^0-9.-]/g, ''));

function provisionalValuation(assetClass: string, details: Record<string, unknown>) {
  if (assetClass === 'multifamily' || assetClass === 'commercial') {
    const noi = numeric(details.noi);
    const capRate = numeric(details.capRate);
    if (!(noi > 0) || !(capRate > 0)) {
      return { error: 'Enter annual NOI and cap rate to calculate a provisional value.' };
    }
    return { value: noi / (capRate / 100), method: 'income_capitalization' };
  }
  if (assetClass === 'land') {
    const acres = numeric(details.acres);
    const pricePerAcre = numeric(details.pricePerAcre);
    if (!(acres > 0) || !(pricePerAcre > 0)) {
      return { error: 'Enter acreage and the supported price per acre.' };
    }
    return { value: acres * pricePerAcre, method: 'price_per_acre' };
  }
  if (assetClass === 'business') {
    const sde = numeric(details.sde);
    const multiple = numeric(details.valuationMultiple);
    if (!(sde > 0) || !(multiple > 0)) {
      return { error: 'Enter seller discretionary earnings and the requested valuation multiple.' };
    }
    return { value: sde * multiple, method: 'sde_multiple' };
  }
  return { error: 'This asset class does not have a supported valuation method.' };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const googleKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  const attomKey = Deno.env.get('ATTOM_API_KEY');
  if (!googleKey) return json({ error: 'Property data services are not configured.' }, 500);

  try {
    const body = await request.json();

    if (body.action === 'autocomplete') {
      const input = String(body.input ?? '').trim();
      if (input.length < 3) return json({ suggestions: [] });

      const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': googleKey,
          'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text',
        },
        body: JSON.stringify({
          input,
          includedRegionCodes: ['us'],
          languageCode: 'en',
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        console.error('Google autocomplete failed', response.status, payload?.error?.status);
        return json({ error: 'Address search is temporarily unavailable.' }, 502);
      }

      const suggestions = (payload.suggestions ?? [])
        .map((item: any) => item.placePrediction)
        .filter(Boolean)
        .map((prediction: any) => ({
          placeId: prediction.placeId,
          description: prediction.text?.text ?? '',
        }));

      return json({ suggestions });
    }

    if (body.action === 'details') {
      if (!attomKey) return json({ error: 'Property data services are not configured.' }, 500);

      const placeId = String(body.placeId ?? '').trim();
      if (!placeId) return json({ error: 'A place ID is required.' }, 400);

      const placeResponse = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
        {
          headers: {
            'X-Goog-Api-Key': googleKey,
            'X-Goog-FieldMask': 'id,formattedAddress,addressComponents,location',
          },
        },
      );
      const place = await placeResponse.json();
      if (!placeResponse.ok) return json({ error: 'That address could not be verified.' }, 502);

      const parts: GoogleComponent[] = place.addressComponents ?? [];
      const streetNumber = component(parts, 'street_number');
      const route = component(parts, 'route');
      const selectedDescription = String(body.description ?? '').trim();
      const describedStreet = selectedDescription.split(',')[0]?.trim() ?? '';
      let address = [streetNumber, route].filter(Boolean).join(' ');

      // Google occasionally returns a route-level place even when the user typed
      // a complete house address. Preserve the selected suggestion's numbered
      // street instead of silently dropping the house number.
      if (!streetNumber && /^\d+[A-Za-z-]*\s+/.test(describedStreet)) {
        address = describedStreet;
      }

      if (!/^\d+[A-Za-z-]*\s+/.test(address)) {
        return json(
          { error: 'Select a complete street address that begins with the house number.' },
          400,
        );
      }
      const city =
        component(parts, 'locality') ||
        component(parts, 'postal_town') ||
        component(parts, 'sublocality');
      const state = component(parts, 'administrative_area_level_1', true);
      const zip = component(parts, 'postal_code');
      const address2 = city && state
        ? `${city}, ${state}${zip ? ` ${zip}` : ''}`
        : [city, state, zip].filter(Boolean).join(' ');

      let property = null;
      let attomMatched = false;
      let valuation: AvmValuation | null = null;
      if (address && address2) {
        const params = new URLSearchParams({ address1: address, address2 });
        const attomResponse = await fetch(
          `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?${params}`,
          {
            headers: {
              Accept: 'application/json',
              APIKey: attomKey,
            },
          },
        );
        const attomPayload = await attomResponse.json().catch(() => null);
        property = attomPayload?.property?.[0] ?? null;
        attomMatched = attomResponse.ok && Boolean(property);
        if (!attomResponse.ok) {
          console.error('ATTOM lookup failed', attomResponse.status, attomPayload?.status?.msg);
        }

        const attomId =
          property?.identifier?.attomId ??
          property?.identifier?.obPropId ??
          property?.identifier?.Id ??
          null;
        valuation = await fetchAvmValuation(attomKey, params, attomId);
      }

      return json({
        address: {
          street: address,
          city,
          state,
          zip,
          formattedAddress: place.formattedAddress ?? '',
          latitude: place.location?.latitude ?? null,
          longitude: place.location?.longitude ?? null,
        },
        attomMatched,
        property,
        valuation,
      });
    }

    if (body.action === 'submit') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!supabaseUrl || !anonKey || !serviceRoleKey) {
        return json({ error: 'Listing submission is not configured.' }, 500);
      }

      // Identify the caller from their own session -- never trust a
      // client-supplied owner id.
      const authHeader = request.headers.get('Authorization') ?? '';
      const callerClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      });
      const { data: userData, error: userError } = await callerClient.auth.getUser();
      if (userError || !userData.user) {
        return json({ error: 'Sign in before submitting a listing.' }, 401);
      }
      const ownerId = userData.user.id;

      const assetClass = String(body.assetClass ?? '').toLowerCase();
      const allowedAssetClasses = ['residential', 'multifamily', 'commercial', 'land', 'business'];
      if (!allowedAssetClasses.includes(assetClass)) {
        return json({ error: 'Choose a valid asset class.' }, 400);
      }

      const street = String(body.address ?? '').trim();
      const city = String(body.city ?? '').trim();
      const state = String(body.state ?? '').trim();
      const zip = String(body.zip ?? '').trim();
      if (!street || !city || !state) {
        return json({ error: 'A complete property address is required.' }, 400);
      }

      const askingPriceDollars = Number(String(body.askingPrice ?? '').replace(/[^0-9.]/g, ''));
      if (!Number.isFinite(askingPriceDollars) || askingPriceDollars <= 0) {
        return json({ error: 'Enter a valid asking price.' }, 400);
      }
      const askingPriceCents = Math.round(askingPriceDollars * 100);
      const requestedTier = String(body.pricingTier ?? '').trim();

      const rawAssetDetails =
        body.assetDetails && typeof body.assetDetails === 'object' ? body.assetDetails : {};

      const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });

      let marketValueCents: number | null = null;
      let discountCents: number | null = null;
      let discountPercent: number | null = null;
      let pricingTier = 'pending_valuation';
      let valuationMethod = '';
      let valuationStatus = 'pending';
      let proofStatus = assetClass === 'residential' ? 'verified' : 'pending';
      let proofDocuments: Array<{ category: string; name: string; path: string }> = [];

      let attomProperty: any = null;
      try {
        attomProperty = body.attomProperty ? JSON.parse(String(body.attomProperty)) : null;
      } catch {
        attomProperty = null;
      }

      if (assetClass === 'residential') {
        const attomIdFromClient =
          attomProperty?.identifier?.attomId ??
          attomProperty?.identifier?.obPropId ??
          attomProperty?.identifier?.Id ??
          null;

        let valuation: AvmValuation | null = null;
        if (attomKey) {
          const address2 = [city, state].filter(Boolean).join(', ') + (zip ? ` ${zip}` : '');
          const params = new URLSearchParams({ address1: street, address2 });
          valuation = await fetchAvmValuation(
            attomKey,
            params,
            attomIdFromClient ? String(attomIdFromClient) : null,
          );
        }

        valuationMethod = 'attom_avm';
        if (valuation && Number.isFinite(valuation.value) && valuation.value > 0) {
          marketValueCents = Math.round(valuation.value * 100);
          const result = validatePricing(marketValueCents, askingPriceCents, requestedTier);
          if (!result.ok) return json({ error: result.error }, 400);
          pricingTier = result.tier;
          discountCents = result.discountCents;
          discountPercent = result.discountPercent;
          valuationStatus = 'verified';
        }
      } else {
        const draftId = String(body.draftId ?? '').trim();
        if (!draftId) return json({ error: 'Save the listing draft before uploading proof.' }, 400);

        const { data: ownedDraft } = await serviceClient
          .from('listing_drafts')
          .select('id')
          .eq('id', draftId)
          .eq('owner_id', ownerId)
          .maybeSingle();
        if (!ownedDraft) return json({ error: 'The proof documents do not belong to this listing draft.' }, 403);

        try {
          proofDocuments = Array.isArray(body.proofDocuments)
            ? body.proofDocuments
            : JSON.parse(String(body.proofDocuments ?? '[]'));
        } catch {
          proofDocuments = [];
        }

        const required = REQUIRED_PROOFS[assetClass] ?? [];
        for (const category of required) {
          const document = proofDocuments.find((item) => item?.category === category);
          const expectedPrefix = `${ownerId}/${draftId}/${category}/`;
          if (!document?.path || !String(document.path).startsWith(expectedPrefix)) {
            return json({ error: `Upload the required ${category.replaceAll('_', ' ')} document.` }, 400);
          }

          const { data: storedFile } = await serviceClient
            .schema('storage')
            .from('objects')
            .select('name')
            .eq('bucket_id', 'listing-proofs')
            .eq('name', String(document.path))
            .maybeSingle();
          if (!storedFile) {
            return json({ error: `The uploaded ${category.replaceAll('_', ' ')} file could not be verified.` }, 400);
          }
        }

        const provisional = provisionalValuation(assetClass, rawAssetDetails);
        if ('error' in provisional) return json({ error: provisional.error }, 400);
        marketValueCents = Math.round(provisional.value * 100);
        valuationMethod = provisional.method;
        proofStatus = 'pending';
        valuationStatus = 'pending';
      }

      const assetDetails = {
        ...rawAssetDetails,
        google: {
          latitude: body.latitude || null,
          longitude: body.longitude || null,
        },
        attom: {
          matched: Boolean(body.attomMatched),
          property: attomProperty,
        },
      };

      const { data, error } = await serviceClient
        .from('listings')
        .insert({
          owner_id: ownerId,
          asset_class: assetClass,
          subtype: String(body.subtype ?? ''),
          title: body.hideAddress ? `${city}, ${state}` : street,
          description: String(body.description ?? ''),
          city,
          state,
          postal_code: zip,
          exact_address: street,
          hide_exact_address: Boolean(body.hideAddress),
          asking_price_cents: askingPriceCents,
          market_value_cents: marketValueCents,
          discount_cents: discountCents,
          discount_percent: discountPercent,
          pricing_tier: pricingTier,
          valuation_method: valuationMethod,
          valuation_status: valuationStatus,
          proof_status: proofStatus,
          proof_documents: proofDocuments,
          status: 'submitted',
          asset_details: assetDetails,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Listing submission failed', error.message);
        return json({ error: 'We could not submit your listing. Please try again.' }, 500);
      }

      return json({
        id: data.id,
        marketValueCents,
        discountCents,
        discountPercent,
        pricingTier,
      });
    }

    return json({ error: 'Unknown action.' }, 400);
  } catch (error) {
    console.error('Property data function failed', error);
    return json({ error: 'Property data is temporarily unavailable.' }, 500);
  }
});
