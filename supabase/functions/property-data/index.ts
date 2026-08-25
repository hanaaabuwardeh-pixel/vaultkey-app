const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

type GoogleComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

const component = (parts: GoogleComponent[] = [], type: string, short = false) => {
  const match = parts.find((part) => part.types?.includes(type));
  return short ? match?.shortText ?? '' : match?.longText ?? '';
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const googleKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  const attomKey = Deno.env.get('ATTOM_API_KEY');
  if (!googleKey || !attomKey) return json({ error: 'Property data services are not configured.' }, 500);

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
      const address = [streetNumber, route].filter(Boolean).join(' ');
      const city =
        component(parts, 'locality') ||
        component(parts, 'postal_town') ||
        component(parts, 'sublocality');
      const state = component(parts, 'administrative_area_level_1', true);
      const zip = component(parts, 'postal_code');
      const address2 = [city, state, zip].filter(Boolean).join(' ');

      let property = null;
      let attomMatched = false;
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
          console.error('ATTOM lookup failed', attomResponse.status);
        }
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
      });
    }

    return json({ error: 'Unknown action.' }, 400);
  } catch (error) {
    console.error('Property data function failed', error);
    return json({ error: 'Property data is temporarily unavailable.' }, 500);
  }
});
