import { Tabs } from 'expo-router';
import { BarChart3, ClipboardList, History, MapPinned, Menu } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

export default function AppTabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { hydrated, user } = useAuth();
  const bottomPadding = Math.max(insets.bottom, 8);

  useEffect(() => {
    if (hydrated && !user) router.replace('/');
  }, [hydrated, router, user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.mint,
        tabBarInactiveTintColor: Colors.textDim,
        tabBarLabelStyle: { fontFamily: Fonts.rounded, fontSize: 10, marginBottom: 4 },
        tabBarStyle: {
          height: 62 + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          backgroundColor: Colors.navyDeep,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Resumen', tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} strokeWidth={2} /> }} />
      <Tabs.Screen name="assignments" options={{ title: 'Asignaciones', tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} strokeWidth={2} /> }} />
      <Tabs.Screen name="menu" options={{ title: 'Menú', tabBarIcon: () => <View style={styles.centerMenu}><Menu color={Colors.ink} size={24} strokeWidth={2.2} /></View>, tabBarLabelStyle: { fontFamily: Fonts.rounded, fontSize: 10, marginBottom: 4, color: Colors.mint } }} />
      <Tabs.Screen name="history" options={{ title: 'Historial', tabBarIcon: ({ color, size }) => <History color={color} size={size} strokeWidth={2} /> }} />
      <Tabs.Screen name="maps" options={{ title: 'Mapas', tabBarIcon: ({ color, size }) => <MapPinned color={color} size={size} strokeWidth={2} /> }} />
      <Tabs.Screen name="territories" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="groups" options={{ href: null }} />
      <Tabs.Screen name="drivers" options={{ href: null }} />
      <Tabs.Screen name="assignment/[id]" options={{ href: null }} />
      <Tabs.Screen name="terms" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerMenu: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: -22, borderRadius: 27, backgroundColor: Colors.mint, borderWidth: 4, borderColor: Colors.navyDeep, shadowColor: Colors.mint, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
});
