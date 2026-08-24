import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';

export function DiscoverNav() {
  const insets = useSafeAreaInsets();
  const safeBottom = Platform.OS === 'android'
    ? Math.max(insets.bottom, 28)
    : Math.max(insets.bottom, 10);

  return (
    <View style={[styles.nav, { bottom: safeBottom }]}>
      <Pressable style={styles.tab} onPress={() => router.replace('/discover')}>
        <Text style={[styles.item, styles.active]}>Discover</Text>
      </Pressable>
      <View style={styles.tab}><Text style={styles.item}>Saved</Text></View>
      <View style={[styles.tab, styles.primaryTab]}><Text style={[styles.item, styles.primaryText]}>List a Deal</Text></View>
      <View style={styles.tab}><Text style={styles.item}>Messages</Text></View>
      <View style={styles.tab}><Text style={styles.item}>Profile</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 74,
    backgroundColor: colors.emeraldDark,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    paddingVertical: 8,
    elevation: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
  },
  tab: {
    flex: 1,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  primaryTab: {
    backgroundColor: colors.emerald,
    marginHorizontal: 3,
  },
  item: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: colors.white,
    fontWeight: '800',
  },
  active: {
    color: colors.gold,
    fontWeight: '800',
  },
});
