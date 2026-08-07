import { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

interface MetricCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: 'teal' | 'blue' | 'amber' | 'cobalt';
  delay?: number;
}

const toneColors = { teal: Colors.mint, blue: Colors.blueBright, amber: Colors.warning, cobalt: '#8DBBFF' };

export function MetricCard({ label, value, icon: Icon, tone, delay = 0 }: MetricCardProps) {
  const accent = toneColors[tone];
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(delay)} style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: `${accent}18` }]}>
        <Icon size={18} color={accent} strokeWidth={1.8} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86} style={styles.label}>{label}</Text>
      <View style={[styles.accent, { backgroundColor: accent }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { width: '47%', flexGrow: 0, flexShrink: 0, minHeight: 132, padding: Spacing.three, borderRadius: Radius.medium, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(17, 40, 74, 0.66)', overflow: 'hidden' },
  iconBox: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  value: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 28, marginTop: 12 },
  label: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 11, marginTop: 2 },
  accent: { position: 'absolute', left: 0, bottom: 0, height: 3, width: '42%' },
});
