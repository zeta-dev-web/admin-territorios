import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { Colors, Radius } from '@/constants/theme';

export function ProgressBar({ value }: { value: number }) {
  const width = `${Math.max(0, Math.min(100, value))}%` as `${number}%`;
  return (
    <View style={styles.track}>
      <LinearGradient colors={[Colors.mint, Colors.blueBright]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 7, width: '100%', overflow: 'hidden', borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.08)' },
  fill: { height: '100%', borderRadius: Radius.pill },
});
