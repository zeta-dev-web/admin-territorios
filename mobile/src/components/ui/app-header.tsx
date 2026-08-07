import { Bell, Code2 } from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { BrandLogo } from '@/components/brand/brand-logo';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

export function AppHeader({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  const initials = (user?.name || user?.email || 'U').slice(0, 1).toUpperCase();

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.row}>
      <BrandLogo compact={compact} />
      <View style={styles.right}>
        {!compact && (
          <Pressable accessibilityLabel="Ver notificaciones" onPress={() => Alert.alert('Notificaciones', 'No tenés notificaciones por ahora.')} style={styles.notification}>
            <Bell size={19} color={Colors.textMuted} strokeWidth={1.8} />
          </Pressable>
        )}
        <Pressable accessibilityLabel="Abrir configuración" onPress={() => router.push('/(app)/settings')} style={styles.profileButton}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      {action && <Text style={styles.action}>{action}</Text>}
    </View>
  );
}

export function AppFooter() {
  return <View style={styles.footer}><View style={styles.footerLine} /><Text style={styles.footerTitle}>Territorios App</Text><Text style={styles.footerDescription}>Sistema de gestión de territorios para congregaciones</Text><View style={styles.footerCredit}><Code2 size={13} color={Colors.blueBright} /><Text style={styles.footerCreditText}>Desarrollado por Zeta Dev</Text></View><Text style={styles.footerCopyright}>© {new Date().getFullYear()} · Todos los derechos reservados</Text></View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notification: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.small, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.border },
  profileButton: { minHeight: 42, justifyContent: 'center', paddingLeft: 2 },
  avatar: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: Colors.blue },
  avatarText: { color: Colors.white, fontFamily: Fonts.rounded, fontSize: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.three },
  eyebrow: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 10, letterSpacing: 1.7, marginBottom: 4 },
  title: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 23, letterSpacing: -0.5 },
  action: { color: Colors.blueBright, fontFamily: Fonts.rounded, fontSize: 12 },
  footer: { alignItems: 'center', paddingHorizontal: Spacing.four, paddingTop: Spacing.five, paddingBottom: Spacing.two },
  footerLine: { width: '72%', height: 1, marginBottom: Spacing.five, backgroundColor: Colors.border },
  footerTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 15 },
  footerDescription: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 10, textAlign: 'center', marginTop: 5 },
  footerCredit: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  footerCreditText: { color: Colors.blueBright, fontFamily: Fonts.rounded, fontSize: 11 },
  footerCopyright: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 9, marginTop: 8 },
});
