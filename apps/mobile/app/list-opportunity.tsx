import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, radius } from '@/lib/theme';
import { getPropertyData, searchAddresses, type AddressSuggestion } from '@/lib/propertyData';
import { saveListingDraft, submitListing } from '@/lib/listings';

type Asset = 'Residential' | 'Multifamily' | 'Commercial' | 'Land' | 'Business';
type Draft = Record<string, string | boolean>;
const assets: { name: Asset; note: string }[] = [
  { name: 'Residential', note: 'Homes, condos, townhomes' },
  { name: 'Multifamily', note: 'Any income property with 2+ units' },
  { name: 'Commercial', note: 'Office, retail, industrial, hospitality' },
  { name: 'Land', note: 'Raw land and developed sites' },
  { name: 'Business', note: 'Business-only opportunities' },
];
const types: Record<Asset, string[]> = {
  Residential: ['Single-Family', 'Condo / Townhome', 'Vacation / Short-Term'],
  Multifamily: ['2+ Units', '2–4 Units', '5–20 Units', '21–50 Units', '51–100 Units', '100+ Units'],
  Commercial: ['Office', 'Retail', 'Industrial / Warehouse', 'Hospitality', 'Medical', 'Special Use'],
  Land: ['Residential Lot', 'Commercial Lot', 'Industrial', 'Agricultural / Ranch', 'Development Land'],
  Business: ['Restaurant', 'Retail', 'Automotive', 'Service', 'Healthcare', 'Other'],
};
const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const fields: Record<Asset, { key: string; label: string; placeholder: string }[]> = {
  Residential: [
    { key: 'beds', label: 'Bedrooms', placeholder: 'Auto-filled when available' }, { key: 'baths', label: 'Bathrooms', placeholder: 'Auto-filled when available' },
    { key: 'livingArea', label: 'Living area (sq ft)', placeholder: 'Auto-filled when available' }, { key: 'yearBuilt', label: 'Year built', placeholder: 'Auto-filled when available' },
    { key: 'condition', label: 'Condition', placeholder: 'Move-in ready / needs work' },
  ],
  Multifamily: [
    { key: 'units', label: 'Total units', placeholder: '24' }, { key: 'occupancy', label: 'Occupancy', placeholder: '92%' },
    { key: 'noi', label: 'Annual NOI', placeholder: '$305,000' }, { key: 'capRate', label: 'Cap rate', placeholder: '7.6%' },
    { key: 'unitMix', label: 'Unit mix', placeholder: '12 × 1BR, 12 × 2BR' },
  ],
  Commercial: [
    { key: 'buildingArea', label: 'Building area (sq ft)', placeholder: '18,500' }, { key: 'noi', label: 'Annual NOI', placeholder: '$520,000' },
    { key: 'capRate', label: 'Cap rate', placeholder: '8.9%' }, { key: 'leaseStatus', label: 'Lease status', placeholder: '100% leased' },
    { key: 'tenancy', label: 'Tenancy', placeholder: 'Single or multi-tenant' },
  ],
  Land: [
    { key: 'acres', label: 'Size (acres)', placeholder: '15.2' }, { key: 'zoning', label: 'Zoning / entitlements', placeholder: 'PD – approved' },
    { key: 'utilities', label: 'Utilities / road access', placeholder: 'All utilities · paved' }, { key: 'developmentStatus', label: 'Development status', placeholder: 'Shovel ready' },
  ],
  Business: [
    { key: 'revenue', label: 'Annual revenue', placeholder: '$1,250,000' }, { key: 'cashFlow', label: 'Cash flow', placeholder: '$225,000' },
    { key: 'sde', label: 'Seller discretionary earnings', placeholder: '$310,000' }, { key: 'yearsOperating', label: 'Years operating', placeholder: '11' },
    { key: 'included', label: 'Included in sale', placeholder: 'Inventory, equipment, real estate' },
  ],
};

export default function ListOpportunityScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [asset, setAsset] = useState<Asset>('Residential');
  const [draft, setDraft] = useState<Draft>({ type: 'Single-Family', hideAddress: true, occupancy: 'Vacant', contact: 'Vault Key messages' });
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const set = (key: string, value: string | boolean) => setDraft((d) => ({ ...d, [key]: value }));
  const adaptiveFields = useMemo(() => fields[asset], [asset]);

  useEffect(() => {
    const query = String(draft.address || '').trim();
    if (selectedPlaceId || query.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setAddressLoading(true);
      setAddressError('');
      try {
        setSuggestions(await searchAddresses(query));
      } catch {
        setSuggestions([]);
        setAddressError('Address suggestions are temporarily unavailable.');
      } finally {
        setAddressLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [draft.address, selectedPlaceId]);

  useEffect(() => {
    if (step === 9 || submitting) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        const id = await saveListingDraft(draftId, draft, step);
        if (!draftId) setDraftId(id);
      } catch {
        // Final submission shows actionable database errors; draft saving stays unobtrusive.
      } finally {
        setSaving(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [asset, draft, draftId, step, submitting]);

  const requiredForStep: Record<number, string[]> = {
    2: ['type'],
    3: ['address', 'city', 'state', 'zip'],
    4: ['askingPrice'],
    5: adaptiveFields.map((field) => field.key),
    7: ['description'],
  };
  const next = async () => {
    const missing = (requiredForStep[step] || []).filter((key) => !String(draft[key] || '').trim());
    if (missing.length) {
      setError('Complete all required information before continuing.');
      return;
    }
    setError('');
    if (step < 8) {
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    try {
      await submitListing(asset, draft, draftId);
      setDraftId(null);
      setStep(9);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Listing submission failed.');
    } finally {
      setSubmitting(false);
    }
  };
  const back = () => {
    setError('');
    if (step === 1) router.back();
    else setStep((current) => Math.max(1, current - 1));
  };
  const chooseAddress = async (item: AddressSuggestion) => {
    setSelectedPlaceId(item.placeId);
    setSuggestions([]);
    setAddressLoading(true);
    setAddressError('');
    try {
      const result = await getPropertyData(item.placeId, item.description);
      const property = result.property as any;
      const rooms = property?.building?.rooms ?? {};
      const size = property?.building?.size ?? {};
      const summary = property?.summary ?? {};
      const buildingSummary = property?.building?.summary ?? {};
      const beds = Number(rooms.beds) || '';
      const baths = Number(rooms.bathstotal ?? rooms.bathscalc) || '';
      const livingArea = Number(size.livingsize ?? size.universalsize ?? size.bldgsize) || '';
      const yearBuilt = Number(summary.yearbuilt ?? buildingSummary.yearbuilteffective) || '';

      setDraft((current) => ({
        ...current,
        address: result.address.street,
        city: result.address.city,
        state: result.address.state,
        zip: result.address.zip,
        latitude: String(result.address.latitude ?? ''),
        longitude: String(result.address.longitude ?? ''),
        formattedAddress: result.address.formattedAddress || item.description,
        beds: String(beds),
        baths: String(baths),
        livingArea: String(livingArea),
        yearBuilt: String(yearBuilt),
        marketValue: String(result.valuation?.value ?? ''),
        avmLow: String(result.valuation?.low ?? ''),
        avmHigh: String(result.valuation?.high ?? ''),
        avmConfidence: String(result.valuation?.confidence ?? ''),
        attomValuation: result.valuation ? JSON.stringify(result.valuation) : '',
        attomMatched: result.attomMatched,
        attomProperty: result.property ? JSON.stringify(result.property) : '',
      }));
    } catch {
      setSelectedPlaceId('');
      setAddressError('We could not verify that address. Please try again.');
    } finally {
      setAddressLoading(false);
    }
  };
  const askingPrice = Number(String(draft.askingPrice ?? '').replace(/[^0-9.]/g, '')) || 0;
  const marketValue = Number(draft.marketValue) || 0;
  const avmLow = Number(draft.avmLow) || 0;
  const avmHigh = Number(draft.avmHigh) || 0;
  const upside = marketValue > 0 && askingPrice > 0 ? marketValue - askingPrice : 0;
  const discountPercent =
    marketValue > 0 && askingPrice > 0
      ? ((marketValue - askingPrice) / marketValue) * 100
      : 0;
  const avmUnavailable = askingPrice > 0 && marketValue <= 0;
  const attomUnavailableMessage = 'ATTOM AVM unavailable — manual valuation required';
  const qualification =
    discountPercent >= 20
      ? 'Vault Pick · 20%+ below ATTOM value'
      : discountPercent >= 15
        ? 'Qualified · 15%+ below ATTOM value'
        : askingPrice > 0 && marketValue > 0
          ? 'Does not meet the 15% minimum'
          : avmUnavailable
            ? attomUnavailableMessage
            : 'Enter the asking price to calculate the discount';

  const title = ['Choose the asset class', 'Choose the property / business type', 'Where is the opportunity?', 'Tell us the financials', 'Tell us about the asset', 'Add photos and documents', 'Describe the opportunity', 'Review your listing'][step - 1];

  if (step === 9) return (
    <SafeAreaView style={styles.safe}><View style={styles.success}>
      <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>
      <Text style={styles.hero}>Listing submitted</Text>
      <Text style={styles.sub}>We’re reviewing your listing for completeness and independent valuation.</Text>
      <View style={styles.timeline}><Text style={styles.good}>● Submitted</Text><Text style={styles.timelineText}>Review · usually within 1 business day</Text><Text style={styles.timelineText}>Live · we’ll notify you when approved</Text></View>
      <Pressable style={styles.primary} onPress={() => router.replace('/discover')}><Text style={styles.primaryText}>Return to Discover</Text></Pressable>
      <Pressable style={styles.secondary} onPress={() => { setStep(1); setDraftId(null); setDraft({ type: 'Single-Family', hideAddress: true, occupancy: 'Vacant', contact: 'Vault Key messages' }); }}><Text style={styles.secondaryText}>Add Another Opportunity</Text></Pressable>
    </View></SafeAreaView>
  );

  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}><Pressable onPress={back} hitSlop={12} style={styles.backButton}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.progress}>{step} of 8</Text><Text style={styles.saved}>{saving ? 'Saving…' : 'Draft saved'}</Text></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.hero}>{title}</Text>
      <Text style={styles.sub}>{step === 1 ? 'Questions adapt to the opportunity you select.' : step === 4 ? 'VaultKey calculates value independently. Sellers cannot enter or change it.' : 'Complete the information buyers need to evaluate this opportunity.'}</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}

      {step === 1 && <View style={styles.stack}>{assets.map((a) => <Choice key={a.name} label={a.name} note={a.note} selected={asset === a.name} onPress={() => { setAsset(a.name); set('type', types[a.name][0]); }} />)}</View>}
      {step === 2 && <View style={styles.grid}>{types[asset].map((t) => <Pressable key={t} onPress={() => set('type', t)} style={[styles.tile, draft.type === t && styles.selected]}><Text style={styles.tileText}>{t}</Text></Pressable>)}</View>}
      {step === 3 && <View style={styles.stack}>
        <Field label="Street address *" value={draft.address} placeholder="Start typing an address" onChange={(v) => { setSelectedPlaceId(''); set('address', v); }} />
        {addressLoading && <View style={styles.addressStatus}><ActivityIndicator color={colors.emerald} /><Text style={styles.hint}>Searching verified addresses…</Text></View>}
        {!!addressError && <Text style={styles.addressError}>{addressError}</Text>}
        {suggestions.length > 0 && <View style={styles.suggestions}>{suggestions.map((item) => <Pressable key={item.placeId} style={styles.suggestion} onPress={() => chooseAddress(item)}><Text style={styles.suggestionTitle}>{item.description}</Text></Pressable>)}</View>}
        <View style={styles.row}><Field half label="City" value={draft.city} placeholder="West Plano" onChange={(v) => set('city', v)} /><Field half label="State" value={draft.state} placeholder="TX" onChange={(v) => set('state', v)} /></View>
        <Field label="ZIP code" value={draft.zip} placeholder="75093" onChange={(v) => set('zip', v)} />
        <View style={styles.switchRow}><View style={{flex:1}}><Text style={styles.label}>Hide exact address until I approve access</Text><Text style={styles.hint}>Discover shows the city only.</Text></View><Switch value={!!draft.hideAddress} onValueChange={(v) => set('hideAddress', v)} trackColor={{true: colors.emerald}} /></View>
        <View style={styles.map}><Text style={styles.mapPin}>●</Text><Text style={styles.mapText}>{String(draft.formattedAddress || [draft.address, draft.city, draft.state, draft.zip].filter(Boolean).join(', ') || 'Property location')}</Text></View>
      </View>}
      {step === 4 && <View style={styles.stack}>
        <Field label="Asking price" value={draft.askingPrice} placeholder="$625,000" onChange={(v) => set('askingPrice', v)} />
        <View style={styles.lockedField}><Text style={styles.label}>ATTOM estimated market value</Text><Text style={styles.lockedValue}>{marketValue > 0 ? money(marketValue) : attomUnavailableMessage}</Text>{avmLow > 0 && avmHigh > 0 ? <Text style={styles.hint}>Estimated range: {money(avmLow)}–{money(avmHigh)}</Text> : null}</View>
        <View style={styles.lockedField}><Text style={styles.label}>Potential upside</Text><Text style={styles.lockedValue}>{marketValue > 0 && askingPrice > 0 ? `${money(upside)} · ${discountPercent.toFixed(1)}% below value` : avmUnavailable ? attomUnavailableMessage : 'Enter asking price to calculate'}</Text></View>
        <View style={styles.valuation}><Text style={styles.valueBig}>{qualification}</Text><Text style={styles.hint}>The ATTOM estimate is locked and cannot be edited by the seller. Listings at least 15% below the verified value qualify; listings at 20%+ receive a Vault Pick label.</Text></View>
      </View>}
      {step === 5 && <View style={styles.stack}><View style={styles.assetBadge}><Text style={styles.assetTitle}>{asset} · {String(draft.type)}</Text></View>{adaptiveFields.map((f) => <Field key={f.key} label={f.label} value={draft[f.key]} placeholder={f.placeholder} onChange={(v) => set(f.key, v)} />)}</View>}
      {step === 6 && <View style={styles.stack}>
        <View style={styles.upload}><Text style={styles.uploadTitle}>＋ Add photos or video</Text><Text style={styles.hint}>Add at least 5 clear photos. First photo becomes the cover.</Text></View>
        {['Seller disclosure', 'Survey / site plan', asset === 'Business' ? 'Profit & loss statement' : 'Inspection report', 'Operating statement', 'Offering memorandum'].map((d) => <View key={d} style={styles.document}><Text style={styles.label}>{d}</Text><Text style={styles.private}>Private until approved</Text></View>)}
      </View>}
      {step === 7 && <View style={styles.stack}>
        <Field multiline label="Deal description" value={draft.description} placeholder="Describe the opportunity, condition, strengths, risks, and value-add potential." onChange={(v) => set('description', v)} />
        <Text style={styles.section}>Who can access private details?</Text>
        {['Verified account', 'Identity verified', 'Proof of funds', 'Signed confidentiality agreement', 'Seller approval required'].map((x) => <Pressable key={x} onPress={() => set(x, !draft[x])} style={styles.checkRow}><Text style={styles.checkbox}>{draft[x] ? '✓' : '□'}</Text><Text style={styles.label}>{x}</Text></Pressable>)}
        <Text style={styles.section}>Preferred contact</Text><View style={styles.grid}>{['Vault Key messages', 'Phone after approval', 'Email after approval'].map((x) => <Pressable key={x} onPress={() => set('contact', x)} style={[styles.tile, draft.contact === x && styles.selected]}><Text style={styles.tileText}>{x}</Text></Pressable>)}</View>
      </View>}
      {step === 8 && <View style={styles.stack}>
        <View style={styles.preview}><View style={styles.previewImage}><Text style={styles.previewImageText}>PHOTO</Text></View><Text style={styles.assetTitle}>{draft.city || 'Location'}, {draft.state || 'State'}</Text><Text style={styles.price}>{draft.askingPrice || 'Asking price'}</Text><Text style={styles.good}>{asset} · {String(draft.type)}</Text></View>
        {[['Property', asset + ' · ' + draft.type], ['Location', draft.hideAddress ? 'City visible · address private' : draft.address], ['Financials', draft.askingPrice || 'Required'], ['Asset details', adaptiveFields.map(f => draft[f.key]).filter(Boolean).join(' · ') || 'Required'], ['Media', 'Photos and documents'], ['Access', 'Controlled approval']].map(([a,b]) => <View key={String(a)} style={styles.reviewRow}><Text style={styles.label}>{a}</Text><Text numberOfLines={2} style={styles.reviewValue}>{String(b)}</Text></View>)}
        <Text style={styles.notice}>What you enter becomes what qualified buyers see in Discover. Independent value is published only after review.</Text>
      </View>}
    </ScrollView>
    <View style={[styles.footer,{paddingBottom:Math.max(insets.bottom + 14, 28)}]}><Pressable disabled={submitting} style={[styles.primary, submitting && styles.disabled]} onPress={next}><Text style={styles.primaryText}>{submitting ? 'Submitting…' : step === 7 ? 'Review Listing' : step === 8 ? 'Submit for Review' : 'Continue'}</Text></Pressable>{step === 8 && <Pressable style={styles.secondary}><Text style={styles.secondaryText}>Save Draft</Text></Pressable>}</View>
  </SafeAreaView>;
}

function Choice({label,note,selected,onPress}:{label:string;note:string;selected:boolean;onPress:()=>void}) { return <Pressable onPress={onPress} style={[styles.choice, selected && styles.selected]}><View><Text style={styles.choiceTitle}>{label}</Text><Text style={styles.hint}>{note}</Text></View><Text style={styles.radio}>{selected ? '●' : '○'}</Text></Pressable>; }
function Field({label,value,placeholder,onChange,half,multiline}:{label:string;value:unknown;placeholder:string;onChange:(v:string)=>void;half?:boolean;multiline?:boolean}) { return <View style={half ? styles.half : undefined}><Text style={styles.label}>{label}</Text><TextInput style={[styles.input,multiline && styles.multiline]} value={typeof value === 'string' ? value : ''} placeholder={placeholder} placeholderTextColor={colors.muted} onChangeText={onChange} multiline={multiline} /></View>; }

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.ivory}, header:{height:58,paddingHorizontal:18,flexDirection:'row',alignItems:'center'},backButton:{width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:22,backgroundColor:colors.white,borderWidth:1,borderColor:colors.border},back:{fontSize:34,lineHeight:38,color:colors.ink},progress:{marginLeft:14,color:colors.emerald,fontWeight:'800'},saved:{marginLeft:'auto',color:colors.emerald,fontSize:11,fontWeight:'700'},
  content:{padding:22,paddingBottom:150},hero:{fontFamily:'serif',fontSize:29,color:colors.ink,marginBottom:5},sub:{fontSize:13,lineHeight:19,color:colors.muted,marginBottom:22},stack:{gap:13},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},
  choice:{minHeight:76,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:colors.white},selected:{borderColor:colors.emerald,backgroundColor:'#EAF4F0'},choiceTitle:{fontSize:16,fontWeight:'800',color:colors.ink},radio:{fontSize:22,color:colors.emerald},
  tile:{width:'48%',minHeight:70,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:12,alignItems:'center',justifyContent:'center',backgroundColor:colors.white},tileText:{color:colors.ink,fontSize:12,fontWeight:'700',textAlign:'center'},
  label:{fontSize:12,fontWeight:'700',color:colors.ink,marginBottom:6},error:{color:'#B42318',fontSize:12,fontWeight:'700',padding:12,marginBottom:14,borderRadius:radius.sm,backgroundColor:'#FEE4E2'},suggestions:{marginTop:-8,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,overflow:'hidden',backgroundColor:colors.white},suggestion:{padding:12,borderBottomWidth:1,borderBottomColor:colors.border},suggestionTitle:{fontSize:13,fontWeight:'800',color:colors.ink},addressStatus:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:4},addressError:{fontSize:11,fontWeight:'700',color:'#B42318'},hint:{fontSize:11,color:colors.muted,lineHeight:16},input:{height:48,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,backgroundColor:colors.white,paddingHorizontal:13,color:colors.ink},multiline:{height:120,paddingTop:12,textAlignVertical:'top'},row:{flexDirection:'row',gap:10},half:{flex:1},
  switchRow:{flexDirection:'row',alignItems:'center',backgroundColor:colors.white,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:14},map:{height:170,borderRadius:radius.md,backgroundColor:'#DDE9DF',alignItems:'center',justifyContent:'center'},mapPin:{fontSize:30,color:colors.emerald},mapText:{fontWeight:'800',color:colors.ink},
  lockedField:{padding:14,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,backgroundColor:'#F1EEE7'},lockedValue:{fontSize:14,fontWeight:'800',color:colors.emerald},valuation:{padding:16,borderRadius:radius.md,backgroundColor:'#EAF4F0',borderWidth:1,borderColor:colors.emerald},valueBig:{fontSize:17,fontWeight:'800',color:colors.emerald,marginBottom:5},assetBadge:{padding:14,borderRadius:radius.md,backgroundColor:colors.emerald},assetTitle:{fontSize:16,fontWeight:'800',color:colors.ink},upload:{height:150,borderWidth:1,borderStyle:'dashed',borderColor:colors.emerald,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:colors.white},uploadTitle:{fontSize:16,fontWeight:'800',color:colors.emerald,marginBottom:7},
  document:{height:54,paddingHorizontal:14,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,backgroundColor:colors.white,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},private:{fontSize:10,color:colors.emerald},section:{fontSize:16,fontWeight:'800',color:colors.ink,marginTop:10},checkRow:{flexDirection:'row',alignItems:'center',gap:9},checkbox:{fontSize:20,color:colors.emerald},
  preview:{padding:14,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,backgroundColor:colors.white},previewImage:{height:130,borderRadius:radius.sm,backgroundColor:colors.emeraldDark,alignItems:'center',justifyContent:'center',marginBottom:12},previewImageText:{color:colors.gold,fontWeight:'800'},price:{fontSize:22,fontWeight:'900',color:colors.ink,marginVertical:4},good:{color:colors.emerald,fontWeight:'800'},reviewRow:{padding:14,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,backgroundColor:colors.white,flexDirection:'row',justifyContent:'space-between',gap:15},reviewValue:{flex:1,textAlign:'right',fontSize:11,color:colors.muted},notice:{fontSize:11,lineHeight:16,color:colors.muted,padding:12,backgroundColor:'#EAF4F0',borderRadius:radius.sm},
  footer:{position:'absolute',left:0,right:0,bottom:0,paddingHorizontal:22,paddingTop:12,backgroundColor:colors.ivory,borderTopWidth:1,borderTopColor:colors.border,elevation:14,shadowColor:'#000',shadowOpacity:.14,shadowRadius:10,shadowOffset:{width:0,height:-4}},primary:{minHeight:58,borderRadius:radius.sm,backgroundColor:colors.emerald,alignItems:'center',justifyContent:'center'},primaryText:{color:colors.white,fontWeight:'800'},secondary:{minHeight:46,borderRadius:radius.sm,borderWidth:1,borderColor:colors.emerald,alignItems:'center',justifyContent:'center',marginTop:8},secondaryText:{color:colors.emerald,fontWeight:'800'},
  success:{flex:1,padding:28,justifyContent:'center'},check:{width:82,height:82,borderRadius:41,backgroundColor:colors.emerald,alignSelf:'center',alignItems:'center',justifyContent:'center',marginBottom:24},checkText:{fontSize:42,color:colors.white,fontWeight:'800'},timeline:{gap:18,padding:18,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,backgroundColor:colors.white,marginVertical:26},timelineText:{color:colors.muted,fontSize:13}
});