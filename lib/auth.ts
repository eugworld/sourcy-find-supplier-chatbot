import { AUTH_STORAGE_KEY } from '@/lib/constants';

type UserCredential = {
  email: string;
  password: string;
};

const DUMMY_USERS: UserCredential[] = [
  { email: 'demo@sourcy.ai', password: 'demo123' },
  { email: 'test@sourcy.ai', password: 'test123' },
];

const registeredUsers: UserCredential[] = [...DUMMY_USERS];

export type AuthState = {
  isAuthenticated: boolean;
  email: string | null;
};

const unauthenticatedState: AuthState = {
  isAuthenticated: false,
  email: null,
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function login(email: string, password: string): boolean {
  const normalizedEmail = normalizeEmail(email);
  return registeredUsers.some(
    (user) => user.email === normalizedEmail && user.password === password,
  );
}

export function register(email: string, password: string): boolean {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return false;
  }

  if (registeredUsers.some((user) => user.email === normalizedEmail)) {
    return false;
  }

  registeredUsers.push({
    email: normalizedEmail,
    password,
  });

  return true;
}

export function getAuthState(): AuthState {
  if (!isBrowser()) {
    return unauthenticatedState;
  }

  const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) {
    return unauthenticatedState;
  }

  try {
    const parsed = JSON.parse(stored) as AuthState;
    if (parsed.isAuthenticated && parsed.email) {
      return {
        isAuthenticated: true,
        email: parsed.email,
      };
    }

    return unauthenticatedState;
  } catch {
    return unauthenticatedState;
  }
}

export function setAuthState(email: string): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      isAuthenticated: true,
      email: normalizeEmail(email),
    }),
  );
}

export function logout(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
