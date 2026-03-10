'use client';

import { useEffect, useRef } from 'react';

import { QUERY_TYPES, type QueryType } from '@/lib/constants';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  queryMode: QueryType;
  onQueryModeChange: (mode: QueryType) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  queryMode,
  onQueryModeChange,
  disabled = false,
  isLoading = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    const nextHeight = Math.min(textarea.scrollHeight, 24 * 6);
    textarea.style.height = `${nextHeight}px`;
  }, [value]);

  const handleSend = () => {
    if (disabled || !value.trim()) {
      return;
    }

    onSend();
  };

  return (
    <div className="border-t border-slate-200 bg-white px-3 py-2 sm:px-4">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white px-2.5 py-1 shadow-sm focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            className="max-h-24 min-h-[34px] flex-1 resize-none bg-transparent py-1 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
            placeholder="Ask about suppliers, products, capabilities..."
          />

          <button
            type="button"
            disabled={disabled || !value.trim()}
            onClick={handleSend}
            className="inline-flex h-8 items-center justify-center rounded-lg bg-teal-600 px-3 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Send
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs">
          <label className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-600">
            <span>Mode</span>
            <select
              value={queryMode}
              onChange={(event) => onQueryModeChange(event.target.value as QueryType)}
              className="bg-transparent font-medium text-slate-700 outline-none"
            >
              <option value={QUERY_TYPES.FAST}>Fast Search</option>
              <option value={QUERY_TYPES.DEEP}>Deep Analysis</option>
            </select>
          </label>

          {isLoading ? (
            <span className="ml-auto inline-flex items-center gap-2 text-xs font-medium text-slate-500">
              <span
                className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600"
                aria-hidden="true"
              />
              Searching...
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
