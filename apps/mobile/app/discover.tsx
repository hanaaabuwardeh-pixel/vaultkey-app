import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { OpportunityCard } from '@/components/OpportunityCard';
import { colors, radius } from '@/lib/theme';

const propertyImage = require('../assets/west-plano.jpg');
const categories = ['All', 'Residential', 'Multifamily', 'Commercial', 'Land', 'Business'];

export default function DiscoverScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Good evening, Hanaa</Text>
        <Text style={styles.heading}>Deals worth opening.</Text>
        <TextInput style={styles.search} placeholder="City, ZIP, address, asset, or keyword" placeholderTextColor={colors.muted} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {categories.map((category, index) => (
            <Pressable key={category} style={[styles.category, index === 0 && styles.categoryActive]}>
              <Text style={[styles.categoryText, index === 0 && styles.categoryTextActive]}>{category}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Featured Opportunity</Text><Text style={styles.viewAll}>View all</Text></View>
        <OpportunityCard featured title="West Plano, TX" askingPrice="$610,000" discount="20%" upside="$150,000" image={propertyImage} />
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Nearby Opportunities</Text><Text style={styles.viewAll}>View all</Text></View>
        <View style={styles.list}>
          <OpportunityCard title="Arlington, TX" askingPrice="$485,000" discount="19%" upside="$110,000" image={propertyImage} />
          <OpportunityCard title="Mesquite, TX" askingPrice="$325,000" discount="22%" upside="$92,000" image={propertyImage} />
        </View>
      </ScrollView>
      <View style={styles.nav}>
        {['Discover', 'Saved', 'List a Deal', 'Messages', 'Profile'].map((label) => <Text key={label} style={[styles.navText, label === 'Discover' && styles.navActive]}>{label}</Text>)}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: 22, paddingBottom: 100 },
  greeting: { color: colors.ink, fontSize: 12, marginTop: 6 },
  heading: { color: colors.ink, fontFamily: 'serif', fontSize: 27, marginTop: 6, marginBottom: 10 },
  search: { height: 46, backgroundColor: colors.white, borderRadius: radius.sm, paddingHorizontal: 12, fontSize: 12 },
  categories: { gap: 7, paddingVertical: 13 },
  category: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 13, height: 34, justifyContent: 'center' },
  categoryActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  categoryText: { color: colors.ink, fontSize: 11 },
  categoryTextActive: { color: colors.white, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 10 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  viewAll: { color: colors.ink, fontSize: 11 },
  list: { gap: 12 },
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 68, backgroundColor: colors.emeraldDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 6 },
  navText: { color: colors.white, fontSize: 9, width: 70, textAlign: 'center' },
  navActive: { color: colors.gold, fontWeight: '700' },
});
