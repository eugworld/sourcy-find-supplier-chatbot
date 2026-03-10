'use client';

import { useState } from 'react';

import { toImageProxyUrl } from '@/lib/image-proxy';

interface ProductCardProps {
  supplierName?: string;
  productName: string;
  imageUrl?: string | null;
  currency?: string | null;
  priceRange?: string | null;
  moqRange?: string | null;
}

export function ProductCard({
  supplierName,
  productName,
  imageUrl,
  currency,
  priceRange,
  moqRange,
}: ProductCardProps) {
  const proxiedImageUrl = toImageProxyUrl(imageUrl);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {proxiedImageUrl ? (
        <div className="block h-40 w-full bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proxiedImageUrl}
            alt={productName}
            className="h-full w-full object-cover"
            loading="lazy"
            onClick={() => setIsPreviewOpen(true)}
            onError={(event) => {
              event.currentTarget.src = '/sourcy-si-icon.svg';
              event.currentTarget.className = 'h-full w-full bg-slate-100 object-contain p-6';
            }}
          />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center bg-slate-100 text-sm text-slate-500">
          No image
        </div>
      )}

      <div className="space-y-2 p-3">
        {supplierName ? (
          <p className="line-clamp-1 text-xs text-slate-500">{supplierName}</p>
        ) : null}
        <p className="line-clamp-2 text-sm font-semibold text-slate-800">{productName}</p>
        <div className="space-y-1 text-xs text-slate-500">
          <p>
            Price:{' '}
            <span className="font-medium text-slate-700">
              {priceRange ? `${currency ?? ''} ${priceRange}`.trim() : 'N/A'}
            </span>
          </p>
          <p>
            MOQ:{' '}
            <span className="font-medium text-slate-700">{moqRange ?? 'N/A'}</span>
          </p>
        </div>
      </div>

      {isPreviewOpen && proxiedImageUrl ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close image preview"
            onClick={() => setIsPreviewOpen(false)}
          />
          <div className="relative z-10 max-h-[90vh] max-w-4xl overflow-hidden rounded-xl bg-white p-2 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proxiedImageUrl}
              alt={productName}
              className="max-h-[84vh] w-full rounded-lg object-contain"
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}
