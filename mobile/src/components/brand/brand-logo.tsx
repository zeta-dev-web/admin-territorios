import { Image } from 'expo-image';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import brandMark from '../../../assets/brand/territorios-app-mark.png';

interface BrandLogoProps {
  compact?: boolean;
  style?: ViewStyle;
}

export function BrandLogo({ compact = false, style }: BrandLogoProps) {
  return (
    <View style={[styles.row, style]}>
      <Image
        source={brandMark}
        alt="Territorios App"
        contentFit="contain"
        style={compact ? styles.markSmall : styles.mark}
      />
      {!compact && (
        <View>
          <Text style={styles.brandText}>Territorios <Text style={styles.brandAccent}>App</Text></Text>
          <Text style={styles.tagline}>ORGANIZA / ASIGNA / COMPLETA</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mark: { width: 58, height: 58 },
  markSmall: { width: 38, height: 38 },
  brandText: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 22, letterSpacing: -0.6 },
  brandAccent: { color: Colors.mint },
  tagline: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 8, letterSpacing: 1.5, marginTop: 3 },
});
