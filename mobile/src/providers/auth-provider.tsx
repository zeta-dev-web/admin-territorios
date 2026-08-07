import * as SecureStore from 'expo-secure-store';
import { PropsWithChildren, createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { mobileAction, LoginData, MobileUser, setSessionExpiredHandler } from '@/lib/api';

const STORAGE_KEY = 'territorios-mobile-session-v1';

async function readSession() {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  }

  return SecureStore.getItemAsync(STORAGE_KEY);
}

async function writeSession(value: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(STORAGE_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(STORAGE_KEY, value);
}

async function clearSession() {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(STORAGE_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(STORAGE_KEY);
}

interface StoredSession extends LoginData {
  expiresAt?: number;
}

function getTokenExpiry(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return undefined;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return decoded.exp ? decoded.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

function sessionIsExpired(session: StoredSession) {
  const expiresAt = session.expiresAt || getTokenExpiry(session.token);
  return Boolean(expiresAt && expiresAt <= Date.now() + 5000);
}

interface AuthContextValue {
  hydrated: boolean;
  token: string | null;
  user: MobileUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  acceptTerms: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<MobileUser | null>(null);
  const sessionExpiredRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    readSession().then((stored) => {
      if (!mounted) return;
      if (stored) {
        try {
          const session = JSON.parse(stored) as StoredSession;
          if (sessionIsExpired(session)) {
            void clearSession();
          } else {
            setToken(session.token);
            setUser(session.user);
          }
        } catch {
          clearSession();
        }
      }
      setHydrated(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      if (sessionExpiredRef.current) return;
      sessionExpiredRef.current = true;
      void clearSession();
      setToken(null);
      setUser(null);
      Alert.alert('Sesión vencida', 'Por seguridad, iniciá sesión nuevamente para continuar.');
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  async function login(email: string, password: string) {
    const data = await mobileAction<LoginData>('login', { email, password });
    sessionExpiredRef.current = false;
    await writeSession(JSON.stringify({ ...data, expiresAt: Date.now() + data.expiresIn * 1000 }));
    setToken(data.token);
    setUser(data.user);
  }

  async function logout() {
    sessionExpiredRef.current = true;
    if (token) {
      await mobileAction('logout', {}, token).catch(() => undefined);
    }
    await clearSession();
    setToken(null);
    setUser(null);
    sessionExpiredRef.current = false;
  }

  async function acceptTerms() {
    if (!token) return;
    await mobileAction('acceptTerms', {}, token);
    setUser((current) => current ? { ...current, termsAccepted: true } : current);
  }

  return (
    <AuthContext.Provider value={{ hydrated, token, user, login, logout, acceptTerms }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
