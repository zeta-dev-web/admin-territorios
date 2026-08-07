import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, ChevronLeft, ChevronRight, Clock3, History, Layers3, Map, MapPinned, Route, UsersRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { AppFooter, AppHeader, SectionTitle } from '@/components/ui/app-header';
import { GlassCard } from '@/components/ui/glass-card';
import { MetricCard } from '@/components/ui/metric-card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ScreenBackground } from '@/components/ui/screen-background';
import { ScreenLoader } from '@/components/ui/screen-loader';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { DashboardMetrics, GeneralStats, mobileAction } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buen día';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function DashboardScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const statsQuery = useQuery({
    queryKey: ['general-stats'],
    queryFn: () => mobileAction<GeneralStats>('getGeneralStats', {}, token),
    enabled: Boolean(token),
  });
  const metricsQuery = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => mobileAction<DashboardMetrics>('getDashboardMetrics', {}, token),
    enabled: Boolean(token),
  });

  const stats = statsQuery.data;
  const metrics = metricsQuery.data;
  const active = metrics?.activeTerritoriesProgress || [];
  const [activeIndex, setActiveIndex] = useState(0);
  const refreshing = statsQuery.isRefetching || metricsQuery.isRefetching;
  const activeAssignment = active[activeIndex % Math.max(active.length, 1)];

  function moveActive(direction: -1 | 1) {
    if (active.length < 2) return;
    setActiveIndex((current) => (current + direction + active.length) % active.length);
  }

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { statsQuery.refetch(); metricsQuery.refetch(); }} tintColor={Colors.mint} colors={[Colors.mint]} />}>
        <AppHeader />

        <Animated.View entering={FadeInDown.duration(600).delay(80)} style={styles.welcome}>
          <Text style={styles.greeting}>{getGreeting()}, {user?.name || 'equipo'}</Text>
          <Text style={styles.congregation}>{user?.congregationName || 'Tu congregación'}</Text>
        </Animated.View>

        {statsQuery.isLoading || metricsQuery.isLoading ? <ScreenLoader label="Cargando resumen..." /> : <>
        <Animated.View entering={FadeInUp.duration(650).delay(140)}>
          <LinearGradient colors={[Colors.panelRaised, Colors.cobalt]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
            <View style={styles.heroGlow} />
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}><Route size={22} color={Colors.mint} strokeWidth={1.8} /></View>
              <Text style={styles.heroTag}>TERRITORIOS APP</Text>
            </View>
            <Text style={styles.heroTitle}>El control de tus territorios al alcance de tu mano.</Text>
            <Text style={styles.heroCopy}>Tenés {stats?.activeAssignments ?? active.length} asignaciones activas para seguir.</Text>
            <View style={styles.heroBottom}>
              <View><Text style={styles.heroNumber}>{stats?.totalTerritories ?? 0}</Text><Text style={styles.heroLabel}>territorios registrados</Text></View>
              <Pressable onPress={() => router.push('/(app)/assignments')} style={({ pressed }) => [styles.heroAction, pressed && styles.pressed]}><Text style={styles.heroActionText}>Ver asignaciones</Text><ArrowUpRight size={16} color={Colors.ink} /></Pressable>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.metricsGrid}>
          <MetricCard label="Activos" value={stats?.activeAssignments ?? 0} icon={Route} tone="teal" delay={220} />
          <MetricCard label="Atrasados" value={metrics?.atrasados.length ?? 0} icon={Clock3} tone="amber" delay={270} />
          <MetricCard label="Completados" value={stats?.completedAssignments ?? 0} icon={Layers3} tone="blue" delay={320} />
          <MetricCard label="Grupos" value={stats?.totalGroups ?? 0} icon={UsersRound} tone="cobalt" delay={370} />
        </View>

        <View>
          <View style={styles.sectionHeading}><SectionTitle eyebrow="SEGUIMIENTO" title="Asignaciones activas" action={active.length ? `${active.length} en curso` : undefined} /></View>
          {active.length === 0 ? (
            <GlassCard style={styles.emptyCard}><MapPinned size={24} color={Colors.textDim} /><Text style={styles.emptyTitle}>Todo tranquilo por acá</Text><Text style={styles.emptyCopy}>Todavía no hay territorios en progreso.</Text></GlassCard>
          ) : activeAssignment ? (
            <Animated.View key={activeAssignment.assignmentId} entering={FadeInUp.duration(420)} style={styles.activeList}>
              <GlassCard style={styles.assignmentCard}>
                <View style={styles.assignmentTop}><View style={styles.territoryBadge}><Text style={styles.territoryBadgeText}>{activeAssignment.territoryNumber}</Text></View><View style={styles.assignmentMain}><Text style={styles.assignmentTitle}>Territorio {activeAssignment.territoryNumber}</Text><Text style={styles.assignmentMeta}>{activeAssignment.driverName}</Text></View><Text style={styles.percent}>{activeAssignment.progressPercentage}%</Text></View>
                <ProgressBar value={activeAssignment.progressPercentage} />
                <View style={styles.progressMeta}><Text style={styles.progressText}>{activeAssignment.completedBlocks} de {activeAssignment.totalBlocks} manzanas</Text><Text style={styles.progressText}>En progreso</Text></View>
                {active.length > 1 && <View style={styles.activeNavigator}><Pressable accessibilityLabel="Asignación anterior" onPress={() => moveActive(-1)} style={styles.arrowButton}><ChevronLeft size={18} color={Colors.mint} /></Pressable><Text style={styles.activeCounter}>{activeIndex % active.length + 1} de {active.length}</Text><Pressable accessibilityLabel="Siguiente asignación" onPress={() => moveActive(1)} style={styles.arrowButton}><ChevronRight size={18} color={Colors.mint} /></Pressable></View>}
              </GlassCard>
            </Animated.View>
          ) : null}
        </View>

        <View>
          <View style={styles.sectionHeading}><SectionTitle eyebrow="ACCESOS RÁPIDOS" title="Gestionar" /></View>
          <View style={styles.quickGrid}>
            <Pressable onPress={() => router.push('/(app)/assignments')} style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}><View style={[styles.quickIcon, { backgroundColor: 'rgba(94,234,212,0.14)' }]}><Route size={19} color={Colors.mint} /></View><Text style={styles.quickTitle}>Asignaciones</Text><Text style={styles.quickCopy}>Ver el trabajo actual</Text></Pressable>
            <Pressable onPress={() => router.push('/(app)/history')} style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}><View style={[styles.quickIcon, { backgroundColor: 'rgba(245,201,106,0.14)' }]}><History size={18} color={Colors.warning} /></View><Text style={styles.quickTitle}>Historial</Text><Text style={styles.quickCopy}>Control y PDF</Text></Pressable>
            <Pressable onPress={() => router.push('/(app)/maps')} style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}><View style={[styles.quickIcon, { backgroundColor: 'rgba(51,133,246,0.15)' }]}><Map size={18} color={Colors.blueBright} /></View><Text style={styles.quickTitle}>Mapas</Text><Text style={styles.quickCopy}>Ver áreas</Text></Pressable>
          </View>
        </View>
        <AppFooter />
        </>}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.eight, gap: Spacing.five },
  welcome: { paddingHorizontal: Spacing.four, gap: 4 },
  greeting: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 26, letterSpacing: -0.6 },
  congregation: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 14 },
  heroCard: { minHeight: 224, marginHorizontal: Spacing.four, padding: Spacing.five, borderRadius: Radius.large, overflow: 'hidden' },
  heroGlow: { position: 'absolute', width: 220, height: 220, borderRadius: 140, backgroundColor: Colors.mint, opacity: 0.08, right: -90, top: -80 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(94,234,212,0.12)' },
  heroTag: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 10, letterSpacing: 1.6 },
  heroTitle: { color: Colors.white, fontFamily: Fonts.rounded, fontSize: 25, marginTop: Spacing.four, letterSpacing: -0.6 },
  heroCopy: { color: 'rgba(248,250,252,0.72)', fontFamily: Fonts.sans, fontSize: 13, marginTop: 5 },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: Spacing.five },
  heroNumber: { color: Colors.white, fontFamily: Fonts.rounded, fontSize: 27 },
  heroLabel: { color: 'rgba(248,250,252,0.62)', fontFamily: Fonts.sans, fontSize: 11, marginTop: 1 },
  heroAction: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, borderRadius: Radius.pill, backgroundColor: Colors.mint },
  heroActionText: { color: Colors.ink, fontFamily: Fonts.rounded, fontSize: 11 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: Spacing.four },
  sectionHeading: { paddingHorizontal: Spacing.four },
  activeList: { paddingHorizontal: Spacing.four },
  assignmentCard: { padding: Spacing.three, gap: Spacing.two },
  assignmentTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  territoryBadge: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: 'rgba(51,133,246,0.16)' },
  territoryBadgeText: { color: Colors.blueBright, fontFamily: Fonts.rounded, fontSize: 17 },
  assignmentMain: { flex: 1, gap: 3 },
  assignmentTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 15 },
  assignmentMeta: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12 },
  percent: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 16 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 11 },
  activeNavigator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.one, borderTopWidth: 1, borderTopColor: Colors.border },
  arrowButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill, backgroundColor: 'rgba(94,234,212,0.1)', borderWidth: 1, borderColor: 'rgba(94,234,212,0.22)' },
  activeCounter: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 11 },
  emptyCard: { marginHorizontal: Spacing.four, alignItems: 'center', padding: Spacing.five, gap: Spacing.one },
  emptyTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 15, marginTop: 5 },
  emptyCopy: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12 },
  quickGrid: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.four },
  quickCard: { flex: 1, minHeight: 112, padding: 10, borderRadius: Radius.medium, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(17,40,74,0.55)', gap: 6 },
  quickIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11, marginBottom: 2 },
  quickTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 11 },
  quickCopy: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 9, lineHeight: 12 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
