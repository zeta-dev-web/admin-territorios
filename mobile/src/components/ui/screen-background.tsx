import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';

export function ScreenBackground({ children }: PropsWithChildren) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.navyDeep, Colors.ink]} style={StyleSheet.absoluteFill} />
      <View style={[styles.orb, styles.orbBlue]} />
      <View style={[styles.orb, styles.orbTeal]} />
      <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.grid} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ink },
  orb: { position: 'absolute', width: 250, height: 250, borderRadius: 150, opacity: 0.16 },
  orbBlue: { backgroundColor: Colors.blue, top: -100, right: -90 },
  orbTeal: { backgroundColor: Colors.teal, bottom: -130, left: -120 },
  grid: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.045,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.mint,
  },
});
