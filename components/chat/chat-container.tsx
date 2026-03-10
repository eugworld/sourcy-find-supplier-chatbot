'use client';

import { useMemo, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

import { LoginModal } from '@/components/auth/login-modal';
import { ChatInput } from '@/components/chat/chat-input';
import { EmptyState } from '@/components/chat/empty-state';
import { MessageList } from '@/components/chat/message-list';
import { Header } from '@/components/ui/header';
import { useAuth } from '@/hooks/use-auth';
import { useChatLimit } from '@/hooks/use-chat-limit';
import { canSendMessage } from '@/lib/chat-limits';
import { QUERY_TYPES, type QueryType } from '@/lib/constants';

export function ChatContainer() {
  const { isAuthenticated, email, signOut } = useAuth();
  const { remaining, limit, consumeMessage, isUnlimited } = useChatLimit(isAuthenticated);
  const isUnlimitedAccess =
    isUnlimited || email?.trim().toLowerCase() === 'demo@sourcy.ai';

  const [input, setInput] = useState('');
  const [queryMode, setQueryMode] = useState<QueryType>(QUERY_TYPES.FAST);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);

  const { messages, sendMessage, status, error, clearError, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const isLoading = useMemo(
    () => status === 'submitted' || status === 'streaming',
    [status],
  );

  const handleSend = async () => {
    const text = input.trim();

    if (!text || isLoading) {
      return;
    }

    if (!isUnlimitedAccess && !canSendMessage(isAuthenticated)) {
      if (!isAuthenticated) {
        setIsLoginModalOpen(true);
      } else {
        setDailyLimitReached(true);
      }
      return;
    }

    setDailyLimitReached(false);
    if (!isUnlimitedAccess) {
      consumeMessage();
    }
    setInput('');

    await sendMessage(
      { text },
      {
        body: {
          queryMode,
        },
      },
    );
  };

  const handleRefreshChat = () => {
    clearError();
    setDailyLimitReached(false);
    setInput('');
    setMessages([]);
  };

  return (
    <div className="flex h-screen flex-col">
      <Header
        isAuthenticated={isAuthenticated}
        remaining={remaining}
        limit={limit}
        isUnlimited={isUnlimitedAccess}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogout={signOut}
        onRefreshChat={handleRefreshChat}
      />

      <main className="flex-1 overflow-hidden bg-slate-50">
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={setInput} />
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </main>

      {dailyLimitReached ? (
        <p className="mx-auto w-full max-w-4xl px-6 pt-2 text-sm text-rose-600">
          You&apos;ve reached your daily limit. Come back tomorrow.
        </p>
      ) : null}

      {error ? (
        <div className="mx-auto mb-2 w-full max-w-4xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error.message}
          <button
            type="button"
            onClick={clearError}
            className="ml-3 font-semibold text-rose-800 underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={() => {
          void handleSend();
        }}
        queryMode={queryMode}
        onQueryModeChange={setQueryMode}
        disabled={isLoading}
        isLoading={isLoading}
      />
      <div className="mx-auto mb-2 flex w-full max-w-4xl flex-col gap-1 px-3 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <p>AI can make mistakes. Please verify supplier and product details.</p>
        <a
          href="https://sourcy.ai"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-slate-600 underline hover:text-teal-700"
        >
          Powered by Sourcy
        </a>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
