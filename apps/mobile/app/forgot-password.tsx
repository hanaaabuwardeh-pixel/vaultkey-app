import { router } from 'expo-router';
import { useState } from 'react';
import { AuthShell, Field, InlineMessage, PrimaryButton, SecondaryButton } from '@/components/AuthUI';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const send = async () => {
    setMessage(''); setError(false);
    if (!supabase) { setError(true); return setMessage('Supabase is not configured on this build.'); }
    if (!email.trim()) { setError(true); return setMessage('Enter your email.'); }
    setBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: 'vaultkey://reset-password' });
    setBusy(false);
    if (resetError) { setError(true); return setMessage(resetError.message); }
    setMessage('Password reset email sent.');
  };

  return <AuthShell title="Reset your password" subtitle="We’ll email you a secure reset link.">
    <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
    {message ? <InlineMessage text={message} error={error} /> : null}
    <PrimaryButton label={busy ? 'Sending…' : 'Send Reset Link'} onPress={send} disabled={busy} />
    <SecondaryButton label="Back to Sign In" onPress={() => router.back()} />
  </AuthShell>;
}
