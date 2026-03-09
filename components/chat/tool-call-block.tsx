'use client';

import { useEffect, useMemo, useState } from 'react';

import { TOOL_PROGRESS_MESSAGES } from '@/lib/constants';

interface ToolCallBlockProps {
  toolName: string;
  state: string;
  output?: unknown;
  errorText?: string;
}

function countSupplierMentions(text: string): number {
  const ids = new Set<string>();
  const pattern = /Supplier ID:\s*([A-Za-z0-9-]+)/gi;

  for (const match of text.matchAll(pattern)) {
    if (match[1]) {
      ids.add(match[1]);
    }
  }

  return ids.size;
}

function stringifyOutput(output: unknown): string {
  if (typeof output === 'string') {
    return output;
  }

  try {
    const serialized = JSON.stringify(output);
    return typeof serialized === 'string' ? serialized : '';
  } catch {
    return '';
  }
}

export function ToolCallBlock({
  toolName,
  state,
  output,
  errorText,
}: ToolCallBlockProps) {
  const [progressIndex, setProgressIndex] = useState(0);

  const isRunning = state === 'input-streaming' || state === 'input-available';
  const isError = state === 'output-error';

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setProgressIndex((prev) => (prev + 1) % TOOL_PROGRESS_MESSAGES.length);
    }, 9000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isRunning]);

  const doneSummary = useMemo(() => {
    const text = stringifyOutput(output);
    const matches = countSupplierMentions(text);

    if (matches > 0) {
      return `Found ${matches} supplier${matches > 1 ? 's' : ''}.`;
    }

    return 'Search complete.';
  }, [output]);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
            isRunning
              ? 'animate-spin border-teal-300 border-t-teal-700'
              : 'border-slate-300'
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
        </span>
        <span className="font-medium text-slate-800">
          {toolName === 'search_suppliers'
            ? 'Supplier Knowledge Search'
            : toolName === 'lookup_supplier_products'
            ? 'PostgREST Supplier Products'
            : toolName.replace(/_/g, ' ')}
        </span>
      </div>

      <p className="mt-1 text-xs text-slate-600">
        {isRunning
          ? TOOL_PROGRESS_MESSAGES[progressIndex]
          : isError
          ? errorText ?? 'Tool execution failed.'
          : doneSummary}
      </p>

      {isRunning ? (
        <p className="mt-1 text-[11px] text-slate-500">
          This can take up to 90 seconds for deeper retrieval.
        </p>
      ) : null}
    </div>
  );
}
