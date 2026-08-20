import type { Session, User } from '@supabase/supabase-js';
import * as LocalAuthentication from 'expo-local-authentication';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
  unlocked: boolean;
  unlockWithBiometrics: () => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    configured: Boolean(supabase),
    unlocked,
    unlockWithBiometrics: async () => {
      if (!session) return { success: false, message: 'Sign in with your password once before using biometrics.' };
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!compatible || !enrolled) return { success: false, message: 'Set up Face ID, face unlock, or fingerprint in your phone settings first.' };
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Vault Key',
        cancelLabel: 'Use password',
        disableDeviceFallback: false,
      });
      if (!result.success) return { success: false, message: 'Biometric sign-in was canceled or unsuccessful.' };
      setUnlocked(true);
      return { success: true };
    },
    signOut: async () => {
      if (supabase) await supabase.auth.signOut();
      setUnlocked(false);
    },
  }), [loading, session, unlocked]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
