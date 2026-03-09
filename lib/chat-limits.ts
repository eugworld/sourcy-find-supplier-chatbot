import {
  ANON_LIMIT,
  AUTH_LIMIT,
  CHAT_USAGE_STORAGE_KEY,
} from '@/lib/constants';

export interface ChatUsage {
  count: number;
  date: string;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function isUnlimitedDemoMode(): boolean {
  if (!isBrowser()) {
    return false;
  }

  return window.location.hostname === 'demo.sourcy.ai';
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getChatUsage(): ChatUsage {
  const today = getTodayString();

  if (!isBrowser()) {
    return { count: 0, date: today };
  }

  const stored = window.localStorage.getItem(CHAT_USAGE_STORAGE_KEY);

  if (!stored) {
    return { count: 0, date: today };
  }

  try {
    const parsed = JSON.parse(stored) as ChatUsage;

    if (parsed.date !== today) {
      return { count: 0, date: today };
    }

    return {
      count: typeof parsed.count === 'number' ? parsed.count : 0,
      date: parsed.date,
    };
  } catch {
    return { count: 0, date: today };
  }
}

export function incrementChatUsage(): ChatUsage {
  const usage = getChatUsage();
  const nextUsage: ChatUsage = {
    ...usage,
    count: usage.count + 1,
  };

  if (isBrowser()) {
    window.localStorage.setItem(CHAT_USAGE_STORAGE_KEY, JSON.stringify(nextUsage));
  }

  return nextUsage;
}

export function canSendMessage(isAuthenticated: boolean): boolean {
  if (isUnlimitedDemoMode()) {
    return true;
  }

  const usage = getChatUsage();
  const limit = isAuthenticated ? AUTH_LIMIT : ANON_LIMIT;

  return usage.count < limit;
}

export function getRemainingMessages(isAuthenticated: boolean): number {
  if (isUnlimitedDemoMode()) {
    return Number.MAX_SAFE_INTEGER;
  }

  const usage = getChatUsage();
  const limit = isAuthenticated ? AUTH_LIMIT : ANON_LIMIT;

  return Math.max(0, limit - usage.count);
}
