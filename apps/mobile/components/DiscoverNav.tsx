import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/lib/theme';

export function DiscoverNav() {
  return (
    <View style={styles.nav}>
      <Pressable onPress={() => router.replace('/discover')}><Text style={[styles.item, styles.active]}>Discover</Text></Pressable>
      <Text style={styles.item}>Saved</Text>
      <Text style={styles.item}>List a Deal</Text>
      <Text style={styles.item}>Messages</Text>
      <Text style={styles.item}>Profile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 68, backgroundColor: colors.emeraldDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 6 },
  item: { color: colors.white, fontSize: 9, width: 66, textAlign: 'center' },
  active: { color: colors.gold, fontWeight: '700' },
});

