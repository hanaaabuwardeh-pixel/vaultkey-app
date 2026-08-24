import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { findOpportunity, money } from '@/lib/opportunities';
import { colors, radius } from '@/lib/theme';

const propertyImage = require('../assets/west-plano.jpg');

export default function OpportunityScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const item = findOpportunity(id);
  const [saved, setSaved] = useState(false);
  const [requested, setRequested] = useState(false);
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.hero}><Image source={propertyImage} style={styles.image} /><Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹</Text></Pressable><Pressable onPress={() => setSaved(!saved)} style={styles.saveIcon}><Text style={styles.saveIconText}>{saved ? '♥' : '♡'}</Text></Pressable><View style={styles.badges}><Text style={styles.badge}>{item.assetClass}</Text><Text style={styles.badge}>✓ Verified</Text></View></View>
        <View style={styles.body}><Text style={styles.location}>{item.location}</Text><Text style={styles.title}>{item.title}</Text><Text style={styles.subtype}>{item.subtype} · {item.strategy} · {item.condition}</Text>
          <View style={styles.numbers}><Number label="Asking Price" value={money(item.askingPrice)} /><Number label="Independent Value" value={money(item.marketValue)} /><Number label="Below Market" value={`${item.discount}%`} /><Number label="Potential Difference" value={money(item.upside)} /></View>
          <Text style={styles.valuationNote}>Independent valuation pending final document verification. Seller cannot edit this value.</Text>
          <View style={styles.quickActions}>
            <Pressable style={styles.quickAction} onPress={() => router.push('/gallery')}><Text style={styles.quickIcon}>▦</Text><Text style={styles.quickText}>Gallery</Text></Pressable>
            <Pressable style={styles.quickAction} onPress={() => router.push('/seller-profile')}><Text style={styles.quickIcon}>♙</Text><Text style={styles.quickText}>Seller</Text></Pressable>
            <Pressable style={styles.quickAction} onPress={() => router.push('/deal-assistant')}><Text style={styles.quickIcon}>✦</Text><Text style={styles.quickText}>Deal Assistant</Text></Pressable>
          </View>
          <Text style={styles.section}>Opportunity summary</Text><Text style={styles.summary}>{item.summary}</Text>
          <Text style={styles.section}>{item.assetClass} details</Text><View style={styles.metrics}>{item.metrics.map((metric) => <View key={metric.label} style={styles.metric}><Text style={styles.metricLabel}>{metric.label}</Text><Text style={styles.metricValue}>{metric.value}</Text></View>)}</View>
          <Text style={styles.section}>Private access</Text><View style={styles.locked}><Text style={styles.lockedTitle}>🔒 Exact address, documents, and seller contact are private.</Text><Text style={styles.lockedCopy}>Access requires a verified profile, proof of funds when required, and seller approval.</Text><View style={styles.checks}><Text style={styles.check}>✓ Verified opportunity</Text><Text style={styles.check}>✓ Independent valuation</Text><Text style={styles.check}>✓ Controlled seller access</Text></View></View>
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 18) }]}><Pressable onPress={() => setSaved(!saved)} style={styles.save}><Text style={styles.saveText}>{saved ? 'Saved' : 'Save'}</Text></Pressable><Pressable disabled={requested} onPress={() => setRequested(true)} style={[styles.request, requested && styles.requested]}><Text style={styles.requestText}>{requested ? 'Access Requested' : 'Request Opportunity Access'}</Text></Pressable></View>
    </SafeAreaView>
  );
}

function Number({ label, value }: { label: string; value: string }) { return <View style={styles.number}><Text style={styles.numberValue}>{value}</Text><Text style={styles.numberLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
  hero: { height: 255, backgroundColor: colors.emeraldDark },
  image: { width: '100%', height: '100%' },
  backButton: { position: 'absolute', top: 14, left: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,.48)', justifyContent: 'center', alignItems: 'center' },
  back: { color: colors.white, fontSize: 36, marginTop: -4 },
  saveIcon: { position: 'absolute', top: 14, right: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,.48)', justifyContent: 'center', alignItems: 'center' },
  saveIconText: { color: colors.white, fontSize: 24 },
  badges: { position: 'absolute', bottom: 12, left: 14, flexDirection: 'row', gap: 8 },
  badge: { backgroundColor: colors.emerald, color: colors.white, borderRadius: radius.pill, overflow: 'hidden', paddingVertical: 6, paddingHorizontal: 10, fontSize: 10, fontWeight: '700' },
  body: { padding: 20 },
  location: { color: colors.emerald, fontWeight: '700', fontSize: 12 },
  title: { color: colors.ink, fontFamily: 'serif', fontSize: 25, marginTop: 4 },
  subtype: { color: colors.muted, fontSize: 11, marginTop: 4 },
  numbers: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginTop: 18, overflow: 'hidden' },
  number: { width: '50%', padding: 15, borderBottomWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  numberValue: { color: colors.ink, fontWeight: '700', fontSize: 17 },
  numberLabel: { color: colors.muted, fontSize: 9, marginTop: 4 },
  valuationNote: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 8 },
  quickActions: { flexDirection: 'row', gap: 8, marginTop: 18 },
  quickAction: { flex: 1, height: 62, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', gap: 4 },
  quickIcon: { color: colors.emerald, fontSize: 17, fontWeight: '700' },
  quickText: { color: colors.ink, fontSize: 9, fontWeight: '700' },
  section: { color: colors.ink, fontFamily: 'serif', fontSize: 19, marginTop: 24, marginBottom: 9 },
  summary: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { width: '48.5%', minHeight: 72, padding: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm },
  metricLabel: { color: colors.muted, fontSize: 9 },
  metricValue: { color: colors.ink, fontWeight: '700', fontSize: 14, marginTop: 7 },
  locked: { backgroundColor: colors.emeraldDark, borderRadius: radius.md, padding: 16 },
  lockedTitle: { color: colors.white, fontWeight: '700', fontSize: 13, lineHeight: 19 },
  lockedCopy: { color: '#CFE0DA', fontSize: 10, lineHeight: 16, marginTop: 7 },
  checks: { marginTop: 12, gap: 7 },
  check: { color: colors.white, fontSize: 11 },
  footer: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.ivory, borderTopWidth: 1, borderColor: colors.border, flexDirection: 'row', gap: 10, elevation: 10, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: -3 } },
  save: { width: 88, height: 52, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.emerald, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: colors.emerald, fontWeight: '700' },
  request: { flex: 1, height: 52, backgroundColor: colors.emerald, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  requested: { backgroundColor: colors.success },
  requestText: { color: colors.white, fontWeight: '700', fontSize: 12 },
});
