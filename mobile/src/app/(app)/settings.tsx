import * as Haptics from 'expo-haptics';
import { ChevronRight, History as HistoryIcon, KeyRound, LogOut, Map as MapIcon, ShieldCheck, Sparkles, UserCog, UserRound, UsersRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AppHeader, SectionTitle } from '@/components/ui/app-header';
import { GlassCard } from '@/components/ui/glass-card';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { MOBILE_API_URL } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export default function SettingsScreen() {
  const router = useRouter();
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

        <SectionTitle eyebrow="CUENTA" title="Preferencias" />
        <GlassCard style={styles.menuCard}>
          <MenuRow icon={KeyRound} title="Cambiar contraseña" subtitle="Mantené tu acceso protegido" />
          <View style={styles.separator} />
          <MenuRow icon={UserRound} title="Perfil de usuario" subtitle={user?.congregationName || 'Datos de la cuenta'} />
          <View style={styles.separator} />
          <MenuRow icon={Sparkles} title="Experiencia móvil" subtitle="Diseñada para una gestión rápida" />
        </GlassCard>

        <SectionTitle eyebrow="ADMINISTRACIÓN" title="Gestionar datos" />
        <GlassCard style={styles.menuCard}>
          <MenuRow icon={UsersRound} title="Grupos e integrantes" subtitle="Responsables y miembros" onPress={() => router.push('/(app)/groups')} />
          <View style={styles.separator} />
          <MenuRow icon={UserCog} title="Conductores" subtitle="Personas que reciben territorios" onPress={() => router.push('/(app)/drivers')} />
          <View style={styles.separator} />
          <MenuRow icon={MapIcon} title="Mapas" subtitle="Mapa general y mapas por grupo" onPress={() => router.push('/(app)/maps')} />
          <View style={styles.separator} />
          <MenuRow icon={HistoryIcon} title="Historial" subtitle="Devoluciones y correcciones" onPress={() => router.push('/(app)/history')} />
        </GlassCard>

        <SectionTitle eyebrow="CONEXIÓN" title="Información técnica" />
        <GlassCard style={styles.infoCard}><Text style={styles.infoLabel}>API ACTIVA</Text><Text style={styles.infoValue}>{MOBILE_API_URL.replace('/api/mobile', '')}</Text><Text style={styles.infoCopy}>La app consulta los mismos datos de tu congregación que la versión web.</Text></GlassCard>

        <Pressable onPress={handleLogout} disabled={loading} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}>{loading ? <ActivityIndicator color={Colors.danger} /> : <><LogOut size={18} color={Colors.danger} /><Text style={styles.logoutText}>Cerrar sesión</Text></>}</Pressable>
        <Text style={styles.footer}>Territorios App · by Zeta Dev</Text>
      </ScrollView>
    </ScreenBackground>
  );
}

function MenuRow({ icon: Icon, title, subtitle, onPress }: { icon: typeof KeyRound; title: string; subtitle: string; onPress?: () => void }) {
  return <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}><View style={styles.menuIcon}><Icon size={18} color={Colors.mint} strokeWidth={1.8} /></View><View style={styles.menuMain}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuSubtitle}>{subtitle}</Text></View><ChevronRight size={17} color={Colors.textDim} /></Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.eight, gap: Spacing.four },
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
  infoCard: { marginHorizontal: Spacing.four, padding: Spacing.four, gap: 7 },
  infoLabel: { color: Colors.textDim, fontFamily: Fonts.rounded, fontSize: 9, letterSpacing: 1.3 },
  infoValue: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 13 },
  infoCopy: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  logout: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginHorizontal: Spacing.four, borderRadius: Radius.medium, borderWidth: 1, borderColor: 'rgba(244,141,145,0.28)', backgroundColor: 'rgba(244,141,145,0.07)' },
  logoutText: { color: Colors.danger, fontFamily: Fonts.rounded, fontSize: 14 },
  footer: { color: Colors.textDim, fontFamily: Fonts.sans, textAlign: 'center', fontSize: 11, marginTop: Spacing.two },
  pressed: { opacity: 0.8 },
  rowPressed: { opacity: 0.75 },
});
