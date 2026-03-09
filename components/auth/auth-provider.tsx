'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  getAuthState,
  login,
  logout,
  register,
  setAuthState,
  type AuthState,
} from '@/lib/auth';

type AuthContextValue = AuthState & {
  isReady: boolean;
  signIn: (email: string, password: string) => boolean;
  signUp: (email: string, password: string) => boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuth] = useState<AuthState>(() => getAuthState());
  const [isReady, setIsReady] = useState(() => typeof window !== 'undefined');

  useEffect(() => {
    const syncAuthState = () => {
      setAuth(getAuthState());
      setIsReady(true);
    };

    const timeout = window.setTimeout(syncAuthState, 0);
    window.addEventListener('storage', syncAuthState);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('storage', syncAuthState);
    };
  }, []);

  const signIn = useCallback((email: string, password: string) => {
    const success = login(email, password);

    if (success) {
      setAuthState(email);
      setAuth(getAuthState());
    }

    return success;
  }, []);

  const signUp = useCallback((email: string, password: string) => {
    const success = register(email, password);

    if (success) {
      setAuthState(email);
      setAuth(getAuthState());
    }

    return success;
  }, []);

  const signOut = useCallback(() => {
    logout();
    setAuth({ isAuthenticated: false, email: null });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...authState,
      isReady,
      signIn,
      signUp,
      signOut,
    }),
    [authState, isReady, signIn, signOut, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used inside <AuthProvider>.');
  }

  return context;
}
