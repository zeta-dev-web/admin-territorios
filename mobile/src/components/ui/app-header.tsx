import { Bell, ChevronDown } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BrandLogo } from '@/components/brand/brand-logo';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

export function AppHeader({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const initials = (user?.name || user?.email || 'U').slice(0, 1).toUpperCase();

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.row}>
      <BrandLogo compact={compact} />
      <View style={styles.right}>
        {!compact && (
          <Pressable style={styles.notification}>
            <Bell size={19} color={Colors.textMuted} strokeWidth={1.8} />
            <View style={styles.notificationDot} />
          </Pressable>
        )}
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        {!compact && <ChevronDown size={15} color={Colors.textDim} />}
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

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notification: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.small, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.border },
  notificationDot: { position: 'absolute', top: 8, right: 9, width: 5, height: 5, borderRadius: 4, backgroundColor: Colors.mint },
  avatar: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: Colors.blue },
  avatarText: { color: Colors.white, fontFamily: Fonts.rounded, fontSize: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.three },
  eyebrow: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 10, letterSpacing: 1.7, marginBottom: 4 },
  title: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 23, letterSpacing: -0.5 },
  action: { color: Colors.blueBright, fontFamily: Fonts.rounded, fontSize: 12 },
});
