'use client';

import { useState } from 'react';
import {
  getToolOrDynamicToolName,
  isToolOrDynamicToolUIPart,
  type UIMessage,
} from 'ai';

import { MarkdownContent } from '@/components/chat/markdown-content';
import { ProductCard } from '@/components/chat/product-card';
import { ProductSidebar } from '@/components/chat/product-sidebar';
import { SourcingCta } from '@/components/chat/sourcing-cta';
import { parseSupplierResponse } from '@/lib/parse-supplier-response';
import {
  parseProductsFromToolOutput,
  parseSupplierNamesFromToolOutput,
} from '@/lib/parse-product-response';
import { SupplierCard } from '@/components/chat/supplier-card';
import { ThinkingBlock } from '@/components/chat/thinking-block';

interface MessageBubbleProps {
  message: UIMessage;
  isStreamingAssistant?: boolean;
}

function sanitizeVisibleAssistantText(text: string): string {
  return text
    .replace(/Supplier ID:\s*[A-Za-z0-9-]+/gi, 'Supplier')
    .replace(/Product ID:\s*[A-Za-z0-9-]+/gi, 'Product');
}

export function MessageBubble({
  message,
  isStreamingAssistant = false,
}: MessageBubbleProps) {
  const [isProductSidebarOpen, setIsProductSidebarOpen] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState('');
  const textParts = message.parts.filter((part) => part.type === 'text');
  const reasoningParts = message.parts.filter((part) => part.type === 'reasoning');
  const toolParts = message.parts.filter((part) => isToolOrDynamicToolUIPart(part));
  const fullText = textParts.map((part) => part.text).join('\n');

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] rounded-2xl rounded-tr-md bg-teal-600 px-4 py-3 text-sm leading-6 text-white shadow-sm sm:max-w-[76%]">
          {fullText || '...'}
        </div>
      </div>
    );
  }

  const supplierCards = parseSupplierResponse(fullText);
  const productCards = toolParts.flatMap((part) =>
    getToolOrDynamicToolName(part) === 'lookup_supplier_products' &&
    part.state === 'output-available'
      ? parseProductsFromToolOutput(part.output)
      : [],
  );
  const supplierNameFromTool = Object.assign(
    {},
    ...toolParts
      .filter(
        (part) =>
          getToolOrDynamicToolName(part) === 'lookup_supplier_products' &&
          part.state === 'output-available',
      )
      .map((part) => parseSupplierNamesFromToolOutput(part.output)),
  );
  const supplierNameById = {
    ...supplierNameFromTool,
    ...Object.fromEntries(
      supplierCards
        .filter((supplier) => Boolean(supplier.supplierName))
        .map((supplier) => [supplier.supplierId, supplier.supplierName ?? '']),
    ),
  };
  const filterTerm = supplierFilter.trim().toLowerCase();
  const filteredSupplierCards =
    filterTerm.length === 0
      ? supplierCards
      : supplierCards.filter((supplier) =>
          (supplier.supplierName ?? '').toLowerCase().includes(filterTerm),
        );
  const filteredProductCards =
    filterTerm.length === 0
      ? productCards
      : productCards.filter((product) =>
          (product.supplierName ?? supplierNameById[product.supplierId] ?? '')
            .toLowerCase()
            .includes(filterTerm),
        );
  const topProductCards = filteredProductCards.slice(0, 3);
  const extraProductCount = Math.max(0, filteredProductCards.length - 3);
  const combinedReasoning = reasoningParts.map((part) => part.text).join('\n\n');
  const toolActivities = toolParts.map((part) => {
    const toolName = getToolOrDynamicToolName(part);
    const label =
      toolName === 'search_suppliers'
        ? 'Supplier Knowledge Search'
        : toolName === 'lookup_supplier_products'
        ? 'PostgREST Supplier Products'
        : toolName.replace(/_/g, ' ');
    const status =
      part.state === 'output-available'
        ? 'Complete'
        : part.state === 'output-error'
        ? 'Failed'
        : 'Running';

    return {
      label,
      status,
      isRunning:
        part.state === 'input-streaming' || part.state === 'input-available',
    };
  });
  const isReasoningStreaming =
    isStreamingAssistant || reasoningParts.some((part) => part.state === 'streaming');
  const hasStructuredCards =
    filteredSupplierCards.length > 0 || filteredProductCards.length > 0;
  const hasTextResponse = textParts.some((part) => part.text.trim().length > 0);
  const fallbackSummary =
    filteredSupplierCards.length > 0 || filteredProductCards.length > 0
      ? `I found ${filteredSupplierCards.length} supplier${
          filteredSupplierCards.length === 1 ? '' : 's'
        } and ${filteredProductCards.length} product${
          filteredProductCards.length === 1 ? '' : 's'
        }.`
      : '';

  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] space-y-3 rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50 px-4 py-3 sm:max-w-[84%]">
        {(reasoningParts.length > 0 || isStreamingAssistant) ? (
          <ThinkingBlock
            content={combinedReasoning || 'Waiting for Gemini thoughts...'}
            isStreaming={isReasoningStreaming}
            toolActivities={toolActivities}
          />
        ) : null}

        {(supplierCards.length > 0 || productCards.length > 0) ? (
          <div className="rounded-lg border border-slate-200 bg-white p-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Filter by supplier name
            </label>
            <input
              value={supplierFilter}
              onChange={(event) => setSupplierFilter(event.target.value)}
              placeholder="e.g. Wenzhou"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-teal-400"
            />
          </div>
        ) : null}

        {filteredSupplierCards.length > 0 ? (
          <div className="space-y-3 pt-1">
            {filteredSupplierCards.map((supplier) => (
              <SupplierCard key={`supplier-${supplier.supplierId}`} {...supplier} />
            ))}
          </div>
        ) : null}

        {topProductCards.length > 0 ? (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topProductCards.map((product) => (
                <ProductCard
                  key={`${product.supplierId}-${product.productId}`}
                  supplierName={
                    product.supplierName ?? supplierNameById[product.supplierId]
                  }
                  productName={product.productName}
                  imageUrl={product.imageUrl}
                  currency={product.currency}
                  saleCount={product.saleCount}
                />
              ))}
            </div>
            {extraProductCount > 0 ? (
              <button
                type="button"
                onClick={() => setIsProductSidebarOpen(true)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
              >
                View more ({extraProductCount})
              </button>
            ) : null}
          </div>
        ) : null}

        {filteredProductCards.length > 0 ? (
          <ProductSidebar
            isOpen={isProductSidebarOpen}
            onClose={() => setIsProductSidebarOpen(false)}
            products={filteredProductCards}
            supplierNameById={supplierNameById}
          />
        ) : null}

        {!hasTextResponse && fallbackSummary ? (
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            {fallbackSummary}
          </div>
        ) : null}

        {textParts.map((part, index) => (
          <div key={`${message.id}-text-${index}`}>
            <MarkdownContent content={sanitizeVisibleAssistantText(part.text)} />
          </div>
        ))}

        {hasStructuredCards ? (
          <SourcingCta
            productNames={Array.from(
              new Set(filteredProductCards.map((product) => product.productName)),
            )}
          />
        ) : null}
      </div>
    </div>
  );
}
