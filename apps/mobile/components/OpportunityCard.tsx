import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/lib/theme';

type OpportunityCardProps = {
  title: string;
  askingPrice: string;
  discount: string;
  upside: string;
  image: number;
  featured?: boolean;
};

export function OpportunityCard({ title, askingPrice, discount, upside, image, featured }: OpportunityCardProps) {
  if (!featured) {
    return (
      <Pressable style={styles.rowCard} accessibilityRole="button" accessibilityLabel={`View ${title} opportunity`}>
        <Image source={image} style={styles.thumbnail} />
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowPrice}>{askingPrice}</Text>
          <Text style={styles.discount}>{discount} below market</Text>
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
      <Pressable style={styles.cta} accessibilityRole="button">
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
  rowCard: { minHeight: 105, flexDirection: 'row', backgroundColor: colors.white, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  thumbnail: { width: 105, minHeight: 105 },
  rowCopy: { flex: 1, padding: 12 },
  rowTitle: { color: colors.ink, fontWeight: '700', fontSize: 14 },
  rowPrice: { color: colors.ink, fontWeight: '700', fontSize: 17, marginTop: 7 },
  discount: { color: colors.emerald, fontSize: 11, marginTop: 7 },
});
