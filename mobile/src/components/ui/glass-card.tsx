import { BlurView } from 'expo-blur';
import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Radius } from '@/constants/theme';

interface GlassCardProps extends PropsWithChildren {
  style?: ViewStyle;
  strong?: boolean;
}

export function GlassCard({ children, style, strong = false }: GlassCardProps) {
  return (
    <View style={[styles.shell, strong && styles.strong, style]}>
      <BlurView intensity={strong ? 30 : 20} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(17, 40, 74, 0.62)',
  },
  strong: { borderColor: Colors.borderStrong, backgroundColor: 'rgba(22, 54, 95, 0.72)' },
  content: { flex: 1 },
});
