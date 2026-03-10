'use client';

import { useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';

import { MessageBubble } from '@/components/chat/message-bubble';

interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
  quoteQuantity?: string;
  quoteDestination?: string;
  isCollectingQuoteDetails?: boolean;
  onStartQuoteFlow?: (productNames: string[], requestText: string) => void;
  onQuoteQuantityChange?: (value: string) => void;
  onQuoteDestinationChange?: (value: string) => void;
}

export function MessageList({
  messages,
  isLoading,
  quoteQuantity = '',
  quoteDestination = '',
  isCollectingQuoteDetails = false,
  onStartQuoteFlow,
  onQuoteQuantityChange,
  onQuoteDestinationChange,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [isLoading, messages]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-4 py-5 sm:px-6"
      aria-live="polite"
    >
      <div className="mx-auto w-full max-w-4xl space-y-4">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreamingAssistant={
              isLoading &&
              message.role === 'assistant' &&
              index === messages.length - 1
            }
            quoteQuantity={quoteQuantity}
            quoteDestination={quoteDestination}
            isCollectingQuoteDetails={
              isCollectingQuoteDetails &&
              message.role === 'assistant' &&
              index === messages.length - 1
            }
            onStartQuoteFlow={onStartQuoteFlow}
            onQuoteQuantityChange={onQuoteQuantityChange}
            onQuoteDestinationChange={onQuoteDestinationChange}
          />
        ))}
        <div ref={bottomAnchorRef} />
      </div>
    </div>
  );
}
