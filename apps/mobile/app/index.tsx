import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

export default function Index() {
  const { session, loading } = useAuth();
  if (loading) return <View style={styles.loading}><ActivityIndicator color={colors.emerald} /></View>;
  return <Redirect href={session ? '/discover' : '/welcome'} />;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ivory } });
