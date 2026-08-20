import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AuthShell, Field, InlineMessage, PasswordField, PrimaryButton, SecondaryButton } from '@/components/AuthUI';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';

export default function SignInScreen() {
  const { session, unlockWithBiometrics } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const signIn = async () => {
    setError('');
    if (!supabase) return setError('Supabase is not configured on this build.');
    if (!email.trim() || !password) return setError('Enter your email and password.');
    setBusy(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setBusy(false);
    if (authError) return setError(authError.message);
    router.replace('/discover');
  };

  const biometricSignIn = async () => {
    setError('');
    const result = await unlockWithBiometrics();
    if (!result.success) return setError(result.message ?? 'Unable to use biometric sign-in.');
    router.replace('/discover');
  };

  return <AuthShell title="Welcome back" subtitle="Sign in to continue finding better opportunities.">
    <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
    <PasswordField label="Password" value={password} onChangeText={setPassword} autoComplete="current-password" />
    <Pressable onPress={() => router.push('/forgot-password')}><Text style={styles.forgot}>Forgot password?</Text></Pressable>
    {error ? <InlineMessage text={error} error /> : null}
    <PrimaryButton label={busy ? 'Signing In…' : 'Sign In'} onPress={signIn} disabled={busy} />
    {session ? <SecondaryButton label="Use Face ID / Fingerprint" onPress={biometricSignIn} /> : null}
    <SecondaryButton label="Create an Account" onPress={() => router.push('/choose-role')} />
  </AuthShell>;
}

const styles = StyleSheet.create({ forgot: { color: colors.emerald, textAlign: 'right', fontWeight: '600', fontSize: 12 } });
