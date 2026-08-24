import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/lib/theme';
import { money } from '@/lib/opportunities';

type OpportunityCardProps = {
  title: string;
  askingPrice: string;
  discount: string;
  upside: string;
  image: number;
  id?: string;
  assetClass?: string;
  marketValue?: number;
  onPress?: () => void;
  featured?: boolean;
};

export function OpportunityCard({ title, askingPrice, discount, upside, image, featured, assetClass, marketValue, onPress }: OpportunityCardProps) {
  if (!featured) {
    return (
      <Pressable onPress={onPress} style={styles.rowCard} accessibilityRole="button" accessibilityLabel={`View ${title} opportunity`}>
        <Image source={image} style={styles.thumbnail} />
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
        {assetClass ? <Text style={styles.asset} numberOfLines={1}>{assetClass}</Text> : null}
        <Text style={styles.rowPrice}>{askingPrice}</Text>
        <Text style={styles.discount} numberOfLines={1}>{discount} below market{marketValue ? ` · ${money(marketValue)} value` : ''}</Text>
      </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.featuredCard}>
      <Image source={image} style={styles.heroImage} />
      <Text style={styles.marketTag}>OFF MARKET</Text>
      <Text style={styles.verified}>✓ VERIFIED SELLER</Text>
      <View style={styles.overlay}>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroMeta}>{askingPrice}   •   {discount} below market   •   {upside} upside</Text>
      </View>
      <Pressable onPress={onPress} style={styles.cta} accessibilityRole="button">
        <Text style={styles.ctaText}>View Opportunity</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  featuredCard: { backgroundColor: colors.white, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  heroImage: { width: '100%', height: 155 },
  marketTag: { position: 'absolute', top: 12, left: 12, color: colors.gold, fontSize: 11, fontWeight: '700' },
  verified: { position: 'absolute', top: 12, right: 12, color: colors.white, fontSize: 10, fontWeight: '700' },
  overlay: { position: 'absolute', top: 103, left: 0, right: 0, height: 52, paddingHorizontal: 12, paddingTop: 7, backgroundColor: 'rgba(0,46,37,.94)' },
  heroTitle: { color: colors.white, fontSize: 15, fontWeight: '700' },
  heroMeta: { color: colors.white, fontSize: 11, marginTop: 4 },
  cta: { height: 42, margin: 10, backgroundColor: colors.emerald, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center' },
  ctaText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  rowCard: { width: '100%', height: 104, maxHeight: 104, flexDirection: 'row', alignSelf: 'stretch', backgroundColor: colors.white, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  thumbnail: { width: 104, height: 104, resizeMode: 'cover' },
  rowCopy: { flex: 1, height: 104, paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center' },
  rowTitle: { color: colors.ink, fontWeight: '700', fontSize: 14 },
  asset: { color: colors.muted, fontSize: 10, marginTop: 3 },
  rowPrice: { color: colors.ink, fontWeight: '700', fontSize: 17, marginTop: 5 },
  discount: { color: colors.emerald, fontSize: 11, marginTop: 5 },
});
