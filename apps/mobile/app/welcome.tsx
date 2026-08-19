import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AuthShell, PrimaryButton, SecondaryButton } from '@/components/AuthUI';
import { colors } from '@/lib/theme';

export default function WelcomeScreen() {
  return (
    <AuthShell title="Welcome to Vault Key" subtitle="Create an account to unlock verified opportunities." top={<View style={styles.brand}><Text style={styles.mark}>VK</Text></View>}>
      <PrimaryButton label="Create Account" onPress={() => router.push('/choose-role')} />
      <SecondaryButton label="Sign In" onPress={() => router.push('/sign-in')} />
      <Text style={styles.note}>Verified opportunities. Serious buyers. Controlled access.</Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  brand: { height: 210, marginHorizontal: -26, marginTop: -36, marginBottom: 42, backgroundColor: colors.emeraldDark, alignItems: 'center', justifyContent: 'center' },
  mark: { color: colors.gold, fontFamily: 'serif', fontSize: 52 },
  note: { color: colors.muted, textAlign: 'center', fontSize: 11, marginTop: 16 },
});
