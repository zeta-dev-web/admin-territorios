import { Tabs } from 'expo-router';
import { BarChart3, ClipboardList, MapPinned, Settings2 } from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.mint,
        tabBarInactiveTintColor: Colors.textDim,
        tabBarLabelStyle: { fontFamily: Fonts.rounded, fontSize: 10, marginBottom: 4 },
        tabBarStyle: {
          height: 76,
          paddingTop: 10,
          paddingBottom: 8,
          backgroundColor: Colors.navyDeep,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Resumen', tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} strokeWidth={2} /> }} />
      <Tabs.Screen name="assignments" options={{ title: 'Asignaciones', tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} strokeWidth={2} /> }} />
      <Tabs.Screen name="territories" options={{ title: 'Territorios', tabBarIcon: ({ color, size }) => <MapPinned color={color} size={size} strokeWidth={2} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Ajustes', tabBarIcon: ({ color, size }) => <Settings2 color={color} size={size} strokeWidth={2} /> }} />
      <Tabs.Screen name="groups" options={{ href: null }} />
      <Tabs.Screen name="drivers" options={{ href: null }} />
      <Tabs.Screen name="maps" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="assignment/[id]" options={{ href: null }} />
      <Tabs.Screen name="terms" options={{ href: null }} />
    </Tabs>
  );
}
