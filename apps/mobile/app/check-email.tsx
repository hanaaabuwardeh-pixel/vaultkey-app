import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AuthShell, PrimaryButton, SecondaryButton } from '@/components/AuthUI';
import { colors } from '@/lib/theme';

export default function CheckEmailScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  return <AuthShell title="Check your email" subtitle={`We sent a confirmation link to ${email ?? 'your email address'}.`} top={<View style={styles.icon}><Text style={styles.iconText}>✉</Text></View>}>
    <PrimaryButton label="I Confirmed My Email" onPress={() => router.replace('/sign-in')} />
    <SecondaryButton label="Use a Different Email" onPress={() => router.replace('/choose-role')} />
  </AuthShell>;
}

const styles = StyleSheet.create({ icon: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#E8F3EE', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 28 }, iconText: { color: colors.emerald, fontSize: 38 } });
