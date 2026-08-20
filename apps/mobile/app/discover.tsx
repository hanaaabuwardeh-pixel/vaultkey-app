import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { OpportunityCard } from '@/components/OpportunityCard';
import { DiscoverNav } from '@/components/DiscoverNav';
import { useAuth } from '@/lib/auth';
import { colors, radius } from '@/lib/theme';
import { AssetClass, money, opportunities } from '@/lib/opportunities';

const propertyImage = require('../assets/west-plano.jpg');
const categories = ['All', 'Residential', 'Multifamily', 'Commercial', 'Land', 'Business'] as const;

export default function DiscoverScreen() {
  const { session, loading, signOut } = useAuth();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof categories)[number]>('All');
  useEffect(() => { if (!loading && !session) router.replace('/welcome'); }, [loading, session]);
  const visible = useMemo(() => opportunities.filter((item) => (category === 'All' || item.assetClass === category) && (!query.trim() || `${item.title} ${item.location} ${item.assetClass} ${item.subtype} ${item.summary}`.toLowerCase().includes(query.trim().toLowerCase()))), [category, query]);
  if (!session) return <SafeAreaView style={styles.safe} />;
  const firstName = session.user.user_metadata.full_name?.split(' ')[0] ?? 'Member';
  const open = (id: string) => router.push({ pathname: '/opportunity', params: { id } });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topline}><Text style={styles.greeting}>Good evening, {firstName}</Text><Pressable onPress={async () => { await signOut(); router.replace('/welcome'); }}><Text style={styles.signOut}>Sign out</Text></Pressable></View>
        <Text style={styles.heading}>Deals worth opening.</Text>
        <Pressable style={styles.searchRow} onPress={() => router.push('/search')}>
          <TextInput value={query} onChangeText={setQuery} onSubmitEditing={() => router.push({ pathname: '/results', params: { q: query, category } })} style={styles.search} placeholder="City, ZIP, address, asset, or keyword" placeholderTextColor={colors.muted} returnKeyType="search" />
          <Pressable onPress={() => router.push('/filters')} style={styles.filterButton}><Text style={styles.filterText}>Filters</Text></Pressable>
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {categories.map((item) => (
            <Pressable key={item} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.categoryActive]}>
              <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Featured Opportunity</Text><Text style={styles.viewAll}>View all</Text></View>
        <OpportunityCard featured title={opportunities[0].location} askingPrice={money(opportunities[0].askingPrice)} discount={`${opportunities[0].discount}%`} upside={money(opportunities[0].upside)} image={propertyImage} onPress={() => open(opportunities[0].id)} />
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Nearby Opportunities</Text><Text style={styles.viewAll}>View all</Text></View>
        <View style={styles.list}>{visible.map((item) => <OpportunityCard key={item.id} id={item.id} assetClass={`${item.assetClass} · ${item.subtype}`} title={item.location} askingPrice={money(item.askingPrice)} marketValue={item.marketValue} discount={`${item.discount}%`} upside={money(item.upside)} image={propertyImage} onPress={() => open(item.id)} />)}</View>
        {!visible.length ? <Text style={styles.empty}>No opportunities match this search yet.</Text> : null}
      </ScrollView>
      <DiscoverNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: 22, paddingBottom: 100 },
  greeting: { color: colors.ink, fontSize: 12, marginTop: 6 },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  signOut: { color: colors.emerald, fontSize: 11, fontWeight: '700' },
  heading: { color: colors.ink, fontFamily: 'serif', fontSize: 27, marginTop: 6, marginBottom: 10 },
  searchRow: { height: 46, backgroundColor: colors.white, borderRadius: radius.sm, flexDirection: 'row', alignItems: 'center' },
  search: { flex: 1, height: 46, paddingHorizontal: 12, fontSize: 12 },
  filterButton: { height: 34, paddingHorizontal: 11, borderLeftWidth: 1, borderLeftColor: colors.border, justifyContent: 'center' }, filterText: { color: colors.emerald, fontSize: 11, fontWeight: '700' },
  categories: { gap: 7, paddingVertical: 13 },
  category: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 13, height: 34, justifyContent: 'center' },
  categoryActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  categoryText: { color: colors.ink, fontSize: 11 },
  categoryTextActive: { color: colors.white, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 10 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  viewAll: { color: colors.ink, fontSize: 11 },
  list: { gap: 12 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 28, fontSize: 13 },
});
