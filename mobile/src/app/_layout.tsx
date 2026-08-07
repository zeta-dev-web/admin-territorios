import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BrandLogo } from '@/components/brand/brand-logo';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function RootNavigator() {
  const { hydrated } = useAuth();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    SplashScreen.hideAsync();
    const timer = setTimeout(() => setShowIntro(false), 1050);
    return () => clearTimeout(timer);
  }, [hydrated]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navyDeep} translucent={false} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.ink } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(app)" />
      </Stack>
      {hydrated && showIntro && <Animated.View entering={FadeIn.duration(260)} exiting={FadeOut.duration(260)} pointerEvents="none" style={styles.introOverlay}>
        <Animated.View entering={ZoomIn.duration(650).springify()} style={styles.introBrand}><BrandLogo /></Animated.View>
        <View style={styles.introLineTrack}><Animated.View entering={FadeIn.delay(260).duration(620)} style={styles.introLine} /></View>
        <ActivityIndicator color={Colors.mint} size="small" style={styles.introSpinner} />
        <Text style={styles.introCaption}>PREPARANDO TU ESPACIO</Text>
      </Animated.View>}
    </>
  );
}

const styles = StyleSheet.create({
  introOverlay: { ...StyleSheet.absoluteFill, zIndex: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.navyDeep },
  introBrand: { transform: [{ scale: 0.98 }] },
  introLineTrack: { width: 132, height: 3, marginTop: 24, overflow: 'hidden', borderRadius: 4, backgroundColor: 'rgba(94,234,212,0.16)' },
  introLine: { width: '100%', height: 3, borderRadius: 4, backgroundColor: Colors.mint },
  introSpinner: { marginTop: 20 },
  introCaption: { color: Colors.textDim, fontFamily: 'sans-serif-medium', fontSize: 9, letterSpacing: 1.8, marginTop: 12 },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
