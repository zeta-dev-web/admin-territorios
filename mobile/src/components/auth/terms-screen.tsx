import * as Haptics from 'expo-haptics';
import { Check, FileText, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/auth-provider';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { BrandLogo } from '@/components/brand/brand-logo';
import { GlassCard } from '@/components/ui/glass-card';
import { ScreenBackground } from '@/components/ui/screen-background';

export function TermsScreen() {
  const { acceptTerms } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);
    try {
      await acceptTerms();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(app)');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron aceptar los términos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(550)}><BrandLogo /></Animated.View>
        <Animated.View entering={FadeInUp.duration(650).delay(100)} style={styles.hero}>
          <View style={styles.icon}><ShieldCheck size={29} color={Colors.mint} strokeWidth={1.7} /></View>
          <Text style={styles.eyebrow}>PRIMER INGRESO</Text>
          <Text style={styles.title}>Antes de comenzar</Text>
          <Text style={styles.subtitle}>Revisá y aceptá los términos para usar Territorios App.</Text>
        </Animated.View>
        <GlassCard style={styles.card} strong>
          <View style={styles.cardHeader}><FileText size={20} color={Colors.blueBright} /><Text style={styles.cardTitle}>Uso del sistema</Text></View>
          <Text style={styles.copy}>La información de grupos, integrantes, territorios y asignaciones debe mantenerse actualizada y utilizarse únicamente para la gestión de tu congregación.</Text>
          <View style={styles.point}><Check size={16} color={Colors.mint} /><Text style={styles.pointText}>Datos organizados por congregación</Text></View>
          <View style={styles.point}><Check size={16} color={Colors.mint} /><Text style={styles.pointText}>Acceso protegido con tu cuenta</Text></View>
          <View style={styles.point}><Check size={16} color={Colors.mint} /><Text style={styles.pointText}>Control administrativo y trazabilidad</Text></View>
        </GlassCard>
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable onPress={handleAccept} disabled={loading} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          {loading ? <ActivityIndicator color={Colors.ink} /> : <><Text style={styles.buttonText}>Aceptar y continuar</Text><Check size={19} color={Colors.ink} /></>}
        </Pressable>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: Spacing.four, paddingTop: Spacing.six, gap: Spacing.five },
  hero: { alignItems: 'flex-start', gap: Spacing.one },
  icon: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(94, 234, 212, 0.11)', marginBottom: Spacing.two },
  eyebrow: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 10, letterSpacing: 1.8 },
  title: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 32, letterSpacing: -0.8 },
  subtitle: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22, maxWidth: 420 },
  card: { padding: Spacing.five, gap: Spacing.three },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 17 },
  copy: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 22 },
  point: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pointText: { color: Colors.text, fontFamily: Fonts.sans, fontSize: 13 },
  error: { color: Colors.danger, fontFamily: Fonts.sans, fontSize: 13 },
  button: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: Radius.medium, backgroundColor: Colors.mint },
  buttonText: { color: Colors.ink, fontFamily: Fonts.rounded, fontSize: 15 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
