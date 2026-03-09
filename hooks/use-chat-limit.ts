'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ANON_LIMIT, AUTH_LIMIT, CHAT_USAGE_STORAGE_KEY } from '@/lib/constants';
import {
  getChatUsage,
  incrementChatUsage,
  isUnlimitedDemoMode,
  type ChatUsage,
} from '@/lib/chat-limits';

export function useChatLimit(isAuthenticated: boolean) {
  const [usage, setUsage] = useState<ChatUsage>({ count: 0, date: '' });

  const refreshUsage = useCallback(() => {
    setUsage(getChatUsage());
  }, []);

  const consumeMessage = useCallback(() => {
    const nextUsage = incrementChatUsage();
    setUsage(nextUsage);
    return nextUsage;
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setUsage(getChatUsage());
    }, 0);

    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === CHAT_USAGE_STORAGE_KEY) {
        refreshUsage();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('storage', onStorage);
    };
  }, [refreshUsage, setUsage]);

  const limit = isAuthenticated ? AUTH_LIMIT : ANON_LIMIT;
  const isUnlimited = isUnlimitedDemoMode();

  return useMemo(() => {
    const remaining = Math.max(0, limit - usage.count);

    return {
      usage,
      limit,
      remaining: isUnlimited ? Number.MAX_SAFE_INTEGER : remaining,
      isLimitReached: isUnlimited ? false : remaining <= 0,
      canSend: isUnlimited ? true : remaining > 0,
      isUnlimited,
      refreshUsage,
      consumeMessage,
    };
  }, [consumeMessage, isUnlimited, limit, refreshUsage, usage]);
}
