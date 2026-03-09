'use client';

import type { ConfidenceLevel } from '@/types/supplier';

const confidenceClassMap: Record<ConfidenceLevel, string> = {
  high: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-rose-100 text-rose-700 border-rose-200',
};

export function Badge({ confidence }: { confidence: ConfidenceLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${confidenceClassMap[confidence]}`}
    >
      {confidence}
    </span>
  );
}
