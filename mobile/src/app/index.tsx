import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { LoginScreen } from '@/components/auth/login-screen';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

export default function EntryScreen() {
  const router = useRouter();
  const { hydrated, user } = useAuth();

  useEffect(() => {
    if (!hydrated || !user) return;
    router.replace(user.termsAccepted ? '/(app)' : '/(app)/terms');
  }, [hydrated, router, user]);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.mint} />
      </View>
    );
  }

  if (user) return <Redirect href={user.termsAccepted ? '/(app)' : '/(app)/terms'} />;
  return <LoginScreen />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.ink },
});
