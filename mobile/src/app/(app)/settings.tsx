import * as Haptics from 'expo-haptics';
import { ChevronRight, KeyRound, LogOut, ShieldCheck, Sparkles, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AppFooter, AppHeader, SectionTitle } from '@/components/ui/app-header';
import { GlassCard } from '@/components/ui/glass-card';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const initial = (user?.name || user?.email || 'U').slice(0, 1).toUpperCase();

  async function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Querés salir de Territorios App?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => { setLoading(true); await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); await logout(); setLoading(false); } },
    ]);
  }

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader />
        <View style={styles.intro}><Text style={styles.eyebrow}>TU ESPACIO</Text><Text style={styles.title}>Ajustes</Text><Text style={styles.subtitle}>Configuración y seguridad de tu cuenta.</Text></View>
        <Animated.View entering={FadeInUp.duration(500)}><GlassCard style={styles.profileCard} strong><View style={styles.profileAvatar}><Text style={styles.profileInitial}>{initial}</Text></View><View style={styles.profileMain}><Text style={styles.profileName}>{user?.name || 'Usuario de congregación'}</Text><Text style={styles.profileEmail}>{user?.email}</Text><View style={styles.rolePill}><ShieldCheck size={12} color={Colors.mint} /><Text style={styles.roleText}>{user?.role === 'ADMIN' ? 'ADMINISTRADOR GENERAL' : user?.congregationName || 'USUARIO DE CONGREGACIÓN'}</Text></View></View></GlassCard></Animated.View>

        <View style={styles.sectionHeading}><SectionTitle eyebrow="CUENTA" title="Preferencias" /></View>
        <GlassCard style={styles.menuCard}>
          <MenuRow icon={KeyRound} title="Cambiar contraseña" subtitle="Mantené tu acceso protegido" />
          <View style={styles.separator} />
          <MenuRow icon={UserRound} title="Perfil de usuario" subtitle={user?.congregationName || 'Datos de la cuenta'} />
          <View style={styles.separator} />
          <MenuRow icon={Sparkles} title="Experiencia móvil" subtitle="Diseñada para una gestión rápida" />
        </GlassCard>

        <Pressable onPress={handleLogout} disabled={loading} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}>{loading ? <ActivityIndicator color={Colors.danger} /> : <><LogOut size={18} color={Colors.danger} /><Text style={styles.logoutText}>Cerrar sesión</Text></>}</Pressable>
        <AppFooter />
      </ScrollView>
    </ScreenBackground>
  );
}

function MenuRow({ icon: Icon, title, subtitle, onPress }: { icon: typeof KeyRound; title: string; subtitle: string; onPress?: () => void }) {
  return <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}><View style={styles.menuIcon}><Icon size={18} color={Colors.mint} strokeWidth={1.8} /></View><View style={styles.menuMain}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuSubtitle}>{subtitle}</Text></View><ChevronRight size={17} color={Colors.textDim} /></Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.eight, gap: Spacing.four },
  sectionHeading: { paddingHorizontal: Spacing.four },
  intro: { paddingHorizontal: Spacing.four, gap: 5 },
  eyebrow: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 10, letterSpacing: 1.8 },
  title: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 32, letterSpacing: -0.8 },
  subtitle: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  profileCard: { marginHorizontal: Spacing.four, flexDirection: 'row', alignItems: 'center', padding: Spacing.four, gap: Spacing.three },
  profileAvatar: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: Colors.blue },
  profileInitial: { color: Colors.white, fontFamily: Fonts.rounded, fontSize: 24 },
  profileMain: { flex: 1, gap: 4 },
  profileName: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 16 },
  profileEmail: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12 },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 3 },
  roleText: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 8, letterSpacing: 0.7 },
  menuCard: { marginHorizontal: Spacing.four, paddingHorizontal: Spacing.three },
  menuRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: 'rgba(94,234,212,0.1)' },
  menuMain: { flex: 1, gap: 4 },
  menuTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 14 },
  menuSubtitle: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 11 },
  separator: { height: 1, backgroundColor: Colors.border },
  logout: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginHorizontal: Spacing.four, borderRadius: Radius.medium, borderWidth: 1, borderColor: 'rgba(244,141,145,0.28)', backgroundColor: 'rgba(244,141,145,0.07)' },
  logoutText: { color: Colors.danger, fontFamily: Fonts.rounded, fontSize: 14 },
  pressed: { opacity: 0.8 },
  rowPressed: { opacity: 0.75 },
});
