import { ChevronRight, Map, MapPinned, Settings2, UserRoundCog, UsersRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '@/components/ui/app-header';
import { GlassCard } from '@/components/ui/glass-card';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

const destinations = [
  { title: 'Grupos', subtitle: 'Integrantes y responsables', icon: UsersRound, route: '/(app)/groups', tone: 'mint' },
  { title: 'Conductores', subtitle: 'Asignados a cada grupo', icon: UserRoundCog, route: '/(app)/drivers', tone: 'blue' },
  { title: 'Territorios', subtitle: 'Cobertura y manzanas', icon: MapPinned, route: '/(app)/territories', tone: 'amber' },
  { title: 'Mapas', subtitle: 'General y áreas por grupo', icon: Map, route: '/(app)/maps', tone: 'teal' },
  { title: 'Configuración', subtitle: 'Contraseña y cuenta', icon: Settings2, route: '/(app)/settings', tone: 'slate' },
] as const;

export default function MenuScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function confirmLogout() {
    Alert.alert('Cerrar sesión', '¿Querés salir de Territorios App?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: async () => { setLoggingOut(true); await logout(); setLoggingOut(false); } },
    ]);
  }

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader />
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>ADMINISTRACIÓN</Text>
          <Text style={styles.title}>Menú</Text>
          <Text style={styles.subtitle}>Accedé a las herramientas de organización de tu congregación.</Text>
        </View>
        <View style={styles.list}>
          {destinations.map((item) => {
            const Icon = item.icon;
            return (
              <Pressable key={item.route} onPress={() => router.push(item.route)} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
                <GlassCard style={styles.card}>
                  <View style={[styles.iconBox, item.tone === 'mint' && styles.iconMint, item.tone === 'blue' && styles.iconBlue, item.tone === 'amber' && styles.iconAmber, item.tone === 'teal' && styles.iconTeal]}>
                    <Icon size={21} color={item.tone === 'amber' ? Colors.warning : item.tone === 'blue' ? Colors.blueBright : Colors.mint} />
                  </View>
                  <View style={styles.copy}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                  </View>
                  <ChevronRight size={20} color={Colors.textDim} />
                </GlassCard>
              </Pressable>
            );
          })}
        </View>
        <Pressable disabled={loggingOut} onPress={confirmLogout} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}>
          {loggingOut ? <ActivityIndicator color={Colors.danger} /> : <Text style={styles.logoutText}>Cerrar sesión</Text>}
        </Pressable>
        <Text style={styles.footer}>Territorios App · desarrollado por Zeta Dev</Text>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.four, paddingBottom: Spacing.eight },
  intro: { paddingHorizontal: Spacing.four, gap: 5 },
  eyebrow: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 10, letterSpacing: 1.8 },
  title: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 32, letterSpacing: -0.8 },
  subtitle: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  list: { gap: 10, paddingHorizontal: Spacing.four },
  pressable: { borderRadius: Radius.medium },
  card: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 12 },
  iconBox: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: 'rgba(168,183,204,0.1)' },
  iconMint: { backgroundColor: 'rgba(94,234,212,0.13)' },
  iconBlue: { backgroundColor: 'rgba(84,161,255,0.15)' },
  iconAmber: { backgroundColor: 'rgba(245,201,106,0.14)' },
  iconTeal: { backgroundColor: 'rgba(32,184,174,0.14)' },
  copy: { flex: 1, gap: 3 },
  cardTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 15 },
  cardSubtitle: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  logout: { minHeight: 50, alignItems: 'center', justifyContent: 'center', marginHorizontal: Spacing.four, borderRadius: Radius.medium, borderWidth: 1, borderColor: 'rgba(244,141,145,0.28)', backgroundColor: 'rgba(244,141,145,0.07)' },
  logoutText: { color: Colors.danger, fontFamily: Fonts.rounded, fontSize: 14 },
  footer: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 11, textAlign: 'center', paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
});
