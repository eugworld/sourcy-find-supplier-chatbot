'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';

import { LoginModal } from '@/components/auth/login-modal';
import { ChatInput } from '@/components/chat/chat-input';
import { EmptyState } from '@/components/chat/empty-state';
import { MessageList } from '@/components/chat/message-list';
import { Header } from '@/components/ui/header';
import { useAuth } from '@/hooks/use-auth';
import { useChatLimit } from '@/hooks/use-chat-limit';
import { logChatMessageEvent, getOrCreateAnonSessionId } from '@/lib/chat-logging';
import { canSendMessage } from '@/lib/chat-limits';
import { QUERY_TYPES, type QueryType } from '@/lib/constants';
import {
  buildWhatsappMessage,
  buildWhatsappUrl,
  extractQuoteDetails,
  isQuoteIntent,
} from '@/lib/quote-flow';

function createLocalAssistantMessage(text: string): UIMessage {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: 'assistant',
    parts: [{ type: 'text', text }],
  } as UIMessage;
}

export function ChatContainer() {
  const { isAuthenticated, email, userId, signOut, isUnlimitedProfile } = useAuth();
  const { remaining, limit, consumeMessage, isUnlimited } = useChatLimit(isAuthenticated);
  const isUnlimitedAccess =
    isUnlimited ||
    isUnlimitedProfile ||
    email?.trim().toLowerCase() === 'demo@sourcy.ai';

  const [input, setInput] = useState('');
  const [queryMode, setQueryMode] = useState<QueryType>(QUERY_TYPES.FAST);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);

  const [isCollectingQuoteDetails, setIsCollectingQuoteDetails] = useState(false);
  const [quoteQuantity, setQuoteQuantity] = useState('');
  const [quoteDestination, setQuoteDestination] = useState('');
  const [quoteProductNames, setQuoteProductNames] = useState<string[]>([]);
  const [quoteRequestText, setQuoteRequestText] = useState('');

  const anonSessionIdRef = useRef<string>('pending');
  const loggedMessageIdsRef = useRef<Set<string>>(new Set());

  const { messages, sendMessage, status, error, clearError, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  useEffect(() => {
    anonSessionIdRef.current = getOrCreateAnonSessionId();
  }, []);

  const isLoading = useMemo(
    () => status === 'submitted' || status === 'streaming',
    [status],
  );

  useEffect(() => {
    for (const message of messages) {
      if (loggedMessageIdsRef.current.has(message.id)) {
        continue;
      }

      loggedMessageIdsRef.current.add(message.id);
      void logChatMessageEvent({
        message,
        queryMode,
        isAuthenticated,
        email,
        userId,
        anonSessionId: anonSessionIdRef.current,
      });
    }
  }, [messages, queryMode, isAuthenticated, email, userId]);

  const appendLocalAssistantText = useCallback(
    (text: string) => {
      setMessages((current) => [...current, createLocalAssistantMessage(text)]);
    },
    [setMessages],
  );

  const startQuoteFlow = useCallback(
    (productNames: string[], requestText: string) => {
      setIsCollectingQuoteDetails(true);
      setQuoteProductNames(productNames);
      if (requestText.trim()) {
        setQuoteRequestText(requestText);
      }

      appendLocalAssistantText(
        'Please share only these two details to continue:\n- Quantity\n- Destination (city, country)',
      );
    },
    [appendLocalAssistantText],
  );

  const handleQuoteIntentFromText = useCallback(
    async (text: string): Promise<boolean> => {
      const details = extractQuoteDetails(text);
      let didHandle = false;

      if (isQuoteIntent(text) && !isCollectingQuoteDetails) {
        setIsCollectingQuoteDetails(true);
        appendLocalAssistantText(
          'Great, I can prepare your quote request. Please share:\n- Quantity\n- Destination (city, country)',
        );
        didHandle = true;
      }

      if (isCollectingQuoteDetails || didHandle || details.quantity || details.destination) {
        if (details.quantity) {
          setQuoteQuantity(details.quantity);
        }
        if (details.destination) {
          setQuoteDestination(details.destination);
        }

        const nextQuantity = details.quantity ?? quoteQuantity;
        const nextDestination = details.destination ?? quoteDestination;

        if (!nextQuantity || !nextDestination) {
          setIsCollectingQuoteDetails(true);
          const missing = [
            !nextQuantity ? 'Quantity' : null,
            !nextDestination ? 'Destination (city, country)' : null,
          ]
            .filter(Boolean)
            .join(' and ');

          appendLocalAssistantText(`Please provide: ${missing}.`);
          return true;
        }

        setIsCollectingQuoteDetails(false);
        setQuoteQuantity(nextQuantity);
        setQuoteDestination(nextDestination);
        const waMessage = buildWhatsappMessage({
          userText: quoteRequestText,
          productNames: quoteProductNames,
          quantity: nextQuantity,
          destination: nextDestination,
        });
        const waUrl = buildWhatsappUrl(waMessage);

        appendLocalAssistantText(
          `Perfect. Quantity: ${nextQuantity}. Destination: ${nextDestination}. Opening WhatsApp now so you can send this to Sourcy merchandiser.`,
        );
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        return true;
      }

      return false;
    },
    [
      appendLocalAssistantText,
      isCollectingQuoteDetails,
      quoteProductNames,
      quoteRequestText,
      quoteDestination,
      quoteQuantity,
    ],
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
    const parsedQuoteDetails = extractQuoteDetails(text);
    const quoteCandidate =
      isCollectingQuoteDetails ||
      isQuoteIntent(text) ||
      Boolean(parsedQuoteDetails.quantity || parsedQuoteDetails.destination);

    if (quoteCandidate) {
      if (!isUnlimitedAccess) {
        consumeMessage();
      }
      setInput('');
      setMessages((current) => [
        ...current,
        {
          id: `user-local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          role: 'user',
          parts: [{ type: 'text', text }],
        } as UIMessage,
      ]);
    }

    const quoteHandled = quoteCandidate ? await handleQuoteIntentFromText(text) : false;
    if (quoteHandled) {
      return;
    }
    if (quoteCandidate) {
      appendLocalAssistantText(
        'Please provide Quantity and Destination (city, country) to proceed with quotation.',
      );
      return;
    }

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
    setIsCollectingQuoteDetails(false);
    setQuoteQuantity('');
    setQuoteDestination('');
    setQuoteProductNames([]);
    setQuoteRequestText('');
    loggedMessageIdsRef.current.clear();
  };

  return (
    <div className="flex h-screen flex-col">
      <Header
        isAuthenticated={isAuthenticated}
        remaining={remaining}
        limit={limit}
        isUnlimited={isUnlimitedAccess}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogout={() => {
          void signOut();
        }}
        onRefreshChat={handleRefreshChat}
      />

      <main className="flex-1 overflow-hidden bg-slate-50">
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={setInput} />
        ) : (
          <MessageList
            messages={messages}
            isLoading={isLoading}
            quoteQuantity={quoteQuantity}
            quoteDestination={quoteDestination}
            isCollectingQuoteDetails={isCollectingQuoteDetails}
            onStartQuoteFlow={(productNames, requestText) => {
              startQuoteFlow(productNames, requestText);
            }}
            onQuoteQuantityChange={setQuoteQuantity}
            onQuoteDestinationChange={setQuoteDestination}
          />
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
      <div className="mx-auto mb-2 flex w-full max-w-4xl items-center justify-between gap-2 px-3 text-[10px] text-slate-500 sm:px-4 sm:text-[11px]">
        <p>AI may make mistakes. Verify key supplier details.</p>
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
