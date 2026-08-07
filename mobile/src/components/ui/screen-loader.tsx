import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

export function ScreenLoader({ label = 'Cargando información...' }: { label?: string }) {
  return (
    <View accessibilityRole="progressbar" style={styles.container}>
      <ActivityIndicator color={Colors.mint} size="small" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 120, marginHorizontal: Spacing.four, alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: Radius.medium, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(6,18,37,0.48)' },
  label: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 13 },
});
