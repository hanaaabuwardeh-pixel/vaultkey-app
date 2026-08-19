import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '@/lib/theme';

export function AuthShell({ title, subtitle, children, top }: PropsWithChildren<{ title: string; subtitle?: string; top?: ReactNode }>) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {top}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.body}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} style={styles.input} placeholderTextColor={colors.muted} /></View>;
}

export function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} style={[styles.primary, disabled && styles.disabled]}><Text style={styles.primaryText}>{label}</Text></Pressable>;
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.secondary}><Text style={styles.secondaryText}>{label}</Text></Pressable>;
}

export function InlineMessage({ text, error }: { text: string; error?: boolean }) {
  return <Text style={[styles.message, error && styles.error]}>{text}</Text>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: colors.ivory },
  content: { flexGrow: 1, paddingHorizontal: 26, paddingTop: 36, paddingBottom: 28 },
  title: { color: colors.ink, fontFamily: 'serif', fontSize: 31, textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8 },
  body: { marginTop: 28, gap: 14 }, field: { gap: 7 }, label: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  input: { height: 50, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 14, color: colors.ink, fontSize: 14 },
  primary: { height: 52, borderRadius: radius.sm, backgroundColor: colors.emerald, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  primaryText: { color: colors.white, fontWeight: '700', fontSize: 14 }, disabled: { opacity: .55 },
  secondary: { height: 50, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.emerald, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { color: colors.emerald, fontWeight: '700', fontSize: 14 },
  message: { color: colors.emerald, fontSize: 12, lineHeight: 17, textAlign: 'center' }, error: { color: '#A23A32' },
});
