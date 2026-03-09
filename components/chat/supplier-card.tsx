'use client';

import { useState } from 'react';

import { MarkdownContent } from '@/components/chat/markdown-content';
import { Badge } from '@/components/ui/badge';
import { Chip } from '@/components/ui/chip';
import type { SupplierCardData } from '@/types/supplier';

export function SupplierCard({
  supplierName,
  summary,
  matched,
  missing,
  confidence,
  reasoning,
}: SupplierCardData) {
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-teal-700">🏭 Supplier</p>
          <p className="mt-0.5 text-sm font-medium text-slate-800">
            {supplierName ?? 'Unnamed supplier'}
          </p>
        </div>
        <Badge confidence={confidence} />
      </div>

      <div className="mt-3">
        <MarkdownContent content={summary} compact />
      </div>

      {matched.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {matched.map((item) => (
            <Chip key={`matched-${item}`} tone="success" className="cursor-default">
              ✅ {item}
            </Chip>
          ))}
        </div>
      ) : null}

      {missing.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {missing.map((item) => (
            <Chip key={`missing-${item}`} tone="warning" className="cursor-default">
              ⚠️ {item}
            </Chip>
          ))}
        </div>
      ) : null}

      {reasoning ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowReasoning((prev) => !prev)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            {showReasoning ? '▾ Hide reasoning' : '▸ View reasoning'}
          </button>
          {showReasoning ? (
            <div className="mt-2 rounded-lg bg-slate-50 p-2">
              <MarkdownContent content={reasoning} compact />
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
