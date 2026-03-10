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
    .replace(/supplier[_\s-]*id/gi, 'supplier')
    .replace(/product[_\s-]*id/gi, 'product')
    .replace(/Supplier ID:\s*[A-Za-z0-9-]+/gi, 'Supplier')
    .replace(/Product ID:\s*[A-Za-z0-9-]+/gi, 'Product')
    .replace(/(supplier\s*[:#-]?\s*)\d{2,}/gi, '$1[hidden]')
    .replace(/(product\s*[:#-]?\s*)\d{2,}/gi, '$1[hidden]');
}

export function MessageBubble({
  message,
  isStreamingAssistant = false,
}: MessageBubbleProps) {
  const [isProductSidebarOpen, setIsProductSidebarOpen] = useState(false);
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
  const topProductCards = productCards.slice(0, 3);
  const extraProductCount = Math.max(0, productCards.length - 3);
  const combinedReasoning = reasoningParts.map((part) => part.text).join('\n\n');
  const toolActivities = toolParts.map((part) => {
    const toolName = getToolOrDynamicToolName(part);
    const label =
      toolName === 'search_suppliers'
        ? 'Sourcy Knowledge: Finding the Right Supplier'
        : toolName === 'lookup_supplier_products'
        ? 'PostgREST: Getting Product Details'
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
    supplierCards.length > 0 || productCards.length > 0;
  const hasTextResponse = textParts.some((part) => part.text.trim().length > 0);
  const fallbackSummary =
    supplierCards.length > 0 || productCards.length > 0
      ? `I found ${supplierCards.length} supplier${
          supplierCards.length === 1 ? '' : 's'
        } and ${productCards.length} product${
          productCards.length === 1 ? '' : 's'
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

        {textParts.map((part, index) => (
          <div key={`${message.id}-text-${index}`}>
            <MarkdownContent content={sanitizeVisibleAssistantText(part.text)} />
          </div>
        ))}

        {supplierCards.length > 0 ? (
          <div className="space-y-3 pt-1">
            {supplierCards.map((supplier) => (
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
                  priceRange={product.priceRange}
                  moqRange={product.moqRange}
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

        {productCards.length > 0 ? (
          <ProductSidebar
            isOpen={isProductSidebarOpen}
            onClose={() => setIsProductSidebarOpen(false)}
            products={productCards}
            supplierNameById={supplierNameById}
          />
        ) : null}

        {!hasTextResponse && fallbackSummary ? (
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            {fallbackSummary}
          </div>
        ) : null}

        {hasStructuredCards ? (
            <SourcingCta
              productNames={Array.from(
                new Set(productCards.map((product) => product.productName)),
            )}
          />
        ) : null}
      </div>
    </div>
  );
}
