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
import type { Session } from '@supabase/supabase-js';

import type { AuthState } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';

type AuthActionResult = {
  success: boolean;
  message?: string;
  requiresEmailConfirmation?: boolean;
};

type AuthContextValue = AuthState & {
  isReady: boolean;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    email: null,
  });
  const [isReady, setIsReady] = useState(() => getSupabaseClient() === null);

  const applySession = useCallback((session: Session | null) => {
    const email = session?.user?.email?.toLowerCase() ?? null;

    setAuth({
      isAuthenticated: Boolean(email),
      email,
    });
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      applySession(data.session);
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
      setIsReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        message: 'Auth is not configured. Missing Supabase environment variables.',
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    applySession(data.session);
    return { success: true };
  }, [applySession]);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        message: 'Auth is not configured. Missing Supabase environment variables.',
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    applySession(data.session);

    if (!data.session) {
      return {
        success: true,
        requiresEmailConfirmation: true,
        message: 'Account created. Check your email to confirm before signing in.',
      };
    }

    return { success: true };
  }, [applySession]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }

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
