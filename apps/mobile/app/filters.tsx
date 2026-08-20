import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AssetClass } from '@/lib/opportunities';
import { colors, radius } from '@/lib/theme';

const classes: Array<'All' | AssetClass> = ['All', 'Residential', 'Multifamily', 'Commercial', 'Land', 'Business'];
const discounts = [0, 10, 15, 20];
const strategies = ['Any', 'Buy & Hold', 'Fix & Flip', 'Value Add', 'Development'];

export default function FiltersScreen() {
  const [category, setCategory] = useState<(typeof classes)[number]>('All');
  const [minimumDiscount, setMinimumDiscount] = useState(15);
  const [strategy, setStrategy] = useState('Any');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const clear = () => { setCategory('All'); setMinimumDiscount(0); setStrategy('Any'); setVerifiedOnly(false); };
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.title}>Find My Opportunity</Text><Pressable onPress={clear}><Text style={styles.reset}>Reset</Text></Pressable></View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.label}>Asset class</Text><View style={styles.wrap}>{classes.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.active]}><Text style={[styles.chipText, category === item && styles.activeText]}>{item}</Text></Pressable>)}</View>
        <Text style={styles.label}>Minimum below-market discount</Text><View style={styles.wrap}>{discounts.map((item) => <Pressable key={item} onPress={() => setMinimumDiscount(item)} style={[styles.chip, minimumDiscount === item && styles.active]}><Text style={[styles.chipText, minimumDiscount === item && styles.activeText]}>{item ? `${item}%+` : 'Any'}</Text></Pressable>)}</View>
        <Text style={styles.label}>Strategy</Text><View style={styles.wrap}>{strategies.map((item) => <Pressable key={item} onPress={() => setStrategy(item)} style={[styles.chip, strategy === item && styles.active]}><Text style={[styles.chipText, strategy === item && styles.activeText]}>{item}</Text></Pressable>)}</View>
        <View style={styles.switchRow}><View><Text style={styles.switchTitle}>Verified opportunities only</Text><Text style={styles.switchCopy}>Independent valuation and seller verification required.</Text></View><Switch value={verifiedOnly} onValueChange={setVerifiedOnly} trackColor={{ true: colors.emerald }} /></View>
        <View style={styles.note}><Text style={styles.noteTitle}>Every asset uses adaptive criteria</Text><Text style={styles.noteCopy}>Residential, multifamily, commercial, land, and businesses are filtered using the fields relevant to that asset.</Text></View>
      </ScrollView>
      <View style={styles.footer}><Pressable onPress={clear} style={styles.secondary}><Text style={styles.secondaryText}>Clear</Text></Pressable><Pressable onPress={() => router.replace({ pathname: '/results', params: { category, minDiscount: String(minimumDiscount), strategy, verified: String(verifiedOnly) } })} style={styles.primary}><Text style={styles.primaryText}>Show Opportunities</Text></Pressable></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory }, header: { height: 64, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { fontSize: 36 }, title: { fontFamily: 'serif', fontSize: 20 }, reset: { color: colors.emerald, fontWeight: '700', fontSize: 12 }, body: { paddingHorizontal: 22, paddingBottom: 28 }, label: { color: colors.ink, fontWeight: '700', fontSize: 14, marginTop: 22, marginBottom: 10 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, backgroundColor: colors.white }, active: { backgroundColor: colors.emerald, borderColor: colors.emerald }, chipText: { color: colors.ink, fontSize: 11 }, activeText: { color: colors.white, fontWeight: '700' }, switchRow: { marginTop: 26, padding: 16, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, switchTitle: { color: colors.ink, fontWeight: '700', fontSize: 13 }, switchCopy: { color: colors.muted, fontSize: 10, marginTop: 4, maxWidth: 250 }, note: { marginTop: 14, padding: 16, backgroundColor: '#E6F0EC', borderRadius: radius.md }, noteTitle: { color: colors.emerald, fontWeight: '700', fontSize: 13 }, noteCopy: { color: colors.ink, fontSize: 11, lineHeight: 17, marginTop: 5 }, footer: { padding: 18, flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: colors.border }, secondary: { width: 90, height: 50, borderWidth: 1, borderColor: colors.emerald, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: colors.emerald, fontWeight: '700' }, primary: { flex: 1, height: 50, borderRadius: radius.sm, backgroundColor: colors.emerald, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: colors.white, fontWeight: '700' },
});
