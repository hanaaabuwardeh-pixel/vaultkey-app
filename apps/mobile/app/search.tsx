import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AssetClass } from '@/lib/opportunities';
import { colors, radius } from '@/lib/theme';

const classes: Array<'All' | AssetClass> = ['All', 'Residential', 'Multifamily', 'Commercial', 'Land', 'Business'];
const suggestions = ['Dallas–Fort Worth', 'Below market land', 'Verified commercial', 'Multifamily under $1M'];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof classes)[number]>('All');
  const submit = (nextQuery = query) => router.push({ pathname: '/results', params: { q: nextQuery, category } });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.title}>Search opportunities</Text><View style={styles.headerSpacer} /></View>
      <View style={styles.body}>
        <TextInput autoFocus value={query} onChangeText={setQuery} onSubmitEditing={() => submit()} placeholder="City, ZIP, address, asset, or keyword" placeholderTextColor={colors.muted} returnKeyType="search" style={styles.input} />
        <Text style={styles.label}>Asset class</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {classes.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}><Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text></Pressable>)}
        </ScrollView>
        <Text style={styles.label}>Popular searches</Text>
        <View style={styles.suggestions}>{suggestions.map((item) => <Pressable key={item} onPress={() => { setQuery(item); submit(item); }} style={styles.suggestion}><Text style={styles.suggestionText}>{item}</Text><Text style={styles.arrow}>›</Text></Pressable>)}</View>
      </View>
      <Pressable onPress={() => submit()} style={styles.button}><Text style={styles.buttonText}>Search Opportunities</Text></Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory }, header: { height: 64, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { fontSize: 36, color: colors.ink }, title: { fontFamily: 'serif', fontSize: 20, color: colors.ink }, headerSpacer: { width: 20 },
  body: { flex: 1, paddingHorizontal: 22 }, input: { height: 52, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 14, color: colors.ink }, label: { marginTop: 24, marginBottom: 10, fontSize: 14, fontWeight: '700', color: colors.ink }, chips: { gap: 8 }, chip: { height: 36, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 14, justifyContent: 'center' }, chipActive: { backgroundColor: colors.emerald, borderColor: colors.emerald }, chipText: { fontSize: 11, color: colors.ink }, chipTextActive: { color: colors.white, fontWeight: '700' },
  suggestions: { borderTopWidth: 1, borderTopColor: colors.border }, suggestion: { height: 54, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, suggestionText: { color: colors.ink, fontSize: 13 }, arrow: { fontSize: 24, color: colors.emerald }, button: { height: 52, margin: 22, backgroundColor: colors.emerald, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: colors.white, fontWeight: '700' },
});
