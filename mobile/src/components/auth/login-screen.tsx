import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '@/providers/auth-provider';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { BrandLogo } from '@/components/brand/brand-logo';
import { GlassCard } from '@/components/ui/glass-card';
import { ScreenBackground } from '@/components/ui/screen-background';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Ingresá tu email y contraseña para continuar.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo iniciar sesión.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(650)} style={styles.brandWrap}>
            <BrandLogo />
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>CONTROL EN TIEMPO REAL</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(700).delay(120)} style={styles.heroCopy}>
            <Text style={styles.eyebrow}>GESTIÓN TERRITORIAL</Text>
            <Text style={styles.title}>Todo tu territorio, en una sola vista.</Text>
            <Text style={styles.subtitle}>
              Organizá grupos, asignaciones y avance de manera simple desde tu congregación.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(700).delay(220)}>
            <GlassCard style={styles.formCard} strong>
              <View style={styles.formHeader}>
                <View>
                  <Text style={styles.formTitle}>Ingresar al sistema</Text>
                  <Text style={styles.formSubtitle}>Usá las mismas credenciales de la web.</Text>
                </View>
                <View style={styles.securityIcon}>
                  <ShieldCheck size={20} color={Colors.mint} strokeWidth={1.8} />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>EMAIL</Text>
                <View style={styles.inputShell}>
                  <Mail size={18} color={Colors.textDim} strokeWidth={1.8} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tu@email.com"
                    placeholderTextColor={Colors.textDim}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="next"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>CONTRASEÑA</Text>
                <View style={styles.inputShell}>
                  <LockKeyhole size={18} color={Colors.textDim} strokeWidth={1.8} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Tu contraseña"
                    placeholderTextColor={Colors.textDim}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    style={styles.input}
                    onSubmitEditing={handleSubmit}
                  />
                  <Pressable onPress={() => setShowPassword((current) => !current)} hitSlop={12}>
                    {showPassword ? <EyeOff size={18} color={Colors.textMuted} /> : <Eye size={18} color={Colors.textMuted} />}
                  </Pressable>
                </View>
              </View>

              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={({ pressed }) => [styles.submitButton, pressed && styles.pressed, loading && styles.disabled]}>
                <LinearGradient colors={[Colors.mint, Colors.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitGradient}>
                  {loading ? <ActivityIndicator color={Colors.ink} /> : <Text style={styles.submitText}>Entrar</Text>}
                  {!loading && <ArrowRight size={19} color={Colors.ink} strokeWidth={2.4} />}
                </LinearGradient>
              </Pressable>
            </GlassCard>
          </Animated.View>

          <Text style={styles.footer}>Territorios App · by Zeta Dev</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: Spacing.four, paddingVertical: Spacing.six, gap: Spacing.six },
  brandWrap: { gap: Spacing.two },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: 'rgba(94, 234, 212, 0.09)', borderWidth: 1, borderColor: Colors.borderStrong },
  liveDot: { width: 6, height: 6, borderRadius: 4, backgroundColor: Colors.mint },
  liveText: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 9, letterSpacing: 1.2 },
  heroCopy: { gap: Spacing.two, maxWidth: 580 },
  eyebrow: { color: Colors.blueBright, fontFamily: Fonts.rounded, fontSize: 11, letterSpacing: 2.1 },
  title: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 38, lineHeight: 44, letterSpacing: -1.2 },
  subtitle: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 16, lineHeight: 24, maxWidth: 430 },
  formCard: { padding: Spacing.five, gap: Spacing.four },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.three },
  formTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 21 },
  formSubtitle: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 13, marginTop: 5 },
  securityIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(94, 234, 212, 0.1)' },
  fieldGroup: { gap: 8 },
  label: { color: Colors.textDim, fontFamily: Fonts.rounded, fontSize: 10, letterSpacing: 1.5 },
  inputShell: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 16, borderRadius: Radius.medium, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(6, 18, 37, 0.5)' },
  input: { flex: 1, color: Colors.text, fontFamily: Fonts.sans, fontSize: 15, paddingVertical: 0 },
  error: { color: Colors.danger, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  submitButton: { borderRadius: Radius.medium, overflow: 'hidden', marginTop: 4 },
  submitGradient: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitText: { color: Colors.ink, fontFamily: Fonts.rounded, fontSize: 16 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  disabled: { opacity: 0.7 },
  footer: { color: Colors.textDim, fontFamily: Fonts.sans, textAlign: 'center', fontSize: 12, marginTop: 'auto' },
});
