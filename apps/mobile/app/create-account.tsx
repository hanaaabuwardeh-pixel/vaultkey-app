import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { AuthShell, Field, InlineMessage, PasswordField, PrimaryButton } from '@/components/AuthUI';
import { supabase } from '@/lib/supabase';

const allowedRoles = ['buyer', 'seller', 'agent'] as const;

export default function CreateAccountScreen() {
  const params = useLocalSearchParams<{ role?: string }>();
  const role = useMemo(() => allowedRoles.includes(params.role as (typeof allowedRoles)[number]) ? params.role! : 'buyer', [params.role]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const createAccount = async () => {
    setError('');
    if (!supabase) return setError('Supabase is not configured on this build.');
    if (!fullName.trim() || !email.trim() || !phone.trim()) return setError('Complete every required field.');
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return setError('Password needs 8 characters, one uppercase letter, and one number.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setBusy(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim(), phone: phone.trim(), role } },
    });
    setBusy(false);
    if (authError) return setError(authError.message);
    if (data.session) return router.replace('/discover');
    router.replace({ pathname: '/check-email', params: { email: email.trim().toLowerCase() } });
  };

  return <AuthShell title="Create your account" subtitle={`Join Vault Key as a ${role === 'buyer' ? 'Buyer / Investor' : role === 'agent' ? 'Real Estate Agent' : 'Seller'}.`}>
    <Field label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" />
    <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
    <Field label="Mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
    <PasswordField label="Password" value={password} onChangeText={setPassword} autoComplete="new-password" />
    <PasswordField label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} autoComplete="new-password" />
    {error ? <InlineMessage text={error} error /> : <InlineMessage text="8+ characters · 1 uppercase letter · 1 number" />}
    <PrimaryButton label={busy ? 'Creating Account…' : 'Create Account'} onPress={createAccount} disabled={busy} />
  </AuthShell>;
}
