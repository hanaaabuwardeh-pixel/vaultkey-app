import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthShell, PrimaryButton } from '@/components/AuthUI';
import { colors, radius } from '@/lib/theme';

const roles = [
  { id: 'buyer', title: 'Buyer / Investor', copy: 'Find and evaluate qualified below-market opportunities.' },
  { id: 'seller', title: 'Seller', copy: 'Share opportunities and control access to private details.' },
  { id: 'agent', title: 'Real Estate Agent', copy: 'Source, list, and manage opportunities for clients.' },
] as const;

export default function ChooseRoleScreen() {
  const [role, setRole] = useState<(typeof roles)[number]['id']>('buyer');
  return <AuthShell title="How will you use Vault Key?" subtitle="Choose your primary role. You can add another later.">
    <View style={styles.roles}>{roles.map((item) => <Pressable key={item.id} onPress={() => setRole(item.id)} style={[styles.role, role === item.id && styles.selected]}>
      <View style={[styles.radio, role === item.id && styles.radioSelected]} />
      <View style={styles.copy}><Text style={styles.roleTitle}>{item.title}</Text><Text style={styles.roleCopy}>{item.copy}</Text></View>
    </Pressable>)}</View>
    <PrimaryButton label="Continue" onPress={() => router.push({ pathname: '/create-account', params: { role } })} />
  </AuthShell>;
}

const styles = StyleSheet.create({
  roles: { gap: 12 }, role: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: 16 },
  selected: { borderColor: colors.emerald, backgroundColor: '#EDF6F2' }, radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.muted },
  radioSelected: { borderWidth: 5, borderColor: colors.emerald }, copy: { flex: 1 }, roleTitle: { color: colors.ink, fontWeight: '700', fontSize: 14 }, roleCopy: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
});
