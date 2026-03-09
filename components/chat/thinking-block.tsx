'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { MarkdownContent } from '@/components/chat/markdown-content';
import { LoadingDots } from '@/components/ui/loading-dots';

interface ThinkingBlockProps {
  content: string;
  isStreaming: boolean;
  toolActivities?: Array<{
    label: string;
    status: string;
    isRunning: boolean;
  }>;
  filterContent?: ReactNode;
}

export function ThinkingBlock({
  content,
  isStreaming,
  toolActivities = [],
  filterContent,
}: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(isStreaming);

  const { fullText } = useMemo(() => {
    const full = content.trim();

    return {
      fullText: full,
    };
  }, [content]);

  if (!content.trim()) {
    return null;
  }

  return (
    <div
      className={`rounded-xl border-l-4 border-l-teal-500 bg-amber-50/65 p-3 text-sm text-slate-700 ${
        isStreaming ? 'animate-thinking-border border-amber-200' : 'border-amber-100'
      }`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="mb-2 inline-flex w-full items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700"
      >
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true">🧠</span>
          {isStreaming ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-flex h-5 w-5 animate-spin items-center justify-center rounded-full border-2 border-amber-500/40 border-t-amber-700"
                aria-hidden="true"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-700" />
              </span>
              <span>
                Thinking <LoadingDots />
              </span>
            </span>
          ) : (
            <span>Thought process</span>
          )}
        </span>
        <span
          aria-hidden="true"
          className={`text-sm text-amber-700 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>

      {isExpanded ? (
        <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
          {toolActivities.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-white/70 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Tool activity
              </p>
              <div className="mt-1 space-y-1.5">
                {toolActivities.map((activity, index) => (
                  <div
                    key={`${activity.label}-${index}`}
                    className="flex items-center justify-between gap-2 text-[11px]"
                  >
                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          activity.isRunning ? 'animate-pulse bg-teal-500' : 'bg-slate-400'
                        }`}
                        aria-hidden="true"
                      />
                      {activity.label}
                    </span>
                    <span className="text-slate-500">{activity.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {filterContent ? (
            <div className="rounded-lg border border-amber-200 bg-white/70 p-2">
              {filterContent}
            </div>
          ) : null}

          <div className="text-[12px] leading-5">
            <MarkdownContent content={fullText} compact />
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          {isStreaming
            ? toolActivities[toolActivities.length - 1]?.status ?? 'Working on your request...'
            : 'Click to expand thought process'}
        </p>
      )}
    </div>
  );
}
