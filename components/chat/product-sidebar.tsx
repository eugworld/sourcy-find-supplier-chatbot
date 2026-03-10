'use client';

import Image from 'next/image';
import { useState } from 'react';

import { toImageProxyUrl } from '@/lib/image-proxy';
import type { ProductCardData } from '@/lib/parse-product-response';

interface ProductSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductCardData[];
  supplierNameById: Record<string, string>;
}

export function ProductSidebar({
  isOpen,
  onClose,
  products,
  supplierNameById,
}: ProductSidebarProps) {
  const [supplierFilter, setSupplierFilter] = useState('');
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  if (!isOpen) {
    return null;
  }

  const normalizedFilter = supplierFilter.trim().toLowerCase();
  const filteredProducts = !normalizedFilter
    ? products
    : products.filter((product) =>
        (supplierNameById[product.supplierId] ?? product.supplierName ?? '')
          .toLowerCase()
          .includes(normalizedFilter),
      );

  return (
    <>
      <button
        type="button"
        aria-label="Close product panel"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-900/25"
      />
      <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Image src="/sourcy-si-icon.svg" alt="Sourcy icon" width={18} height={18} />
            Product details
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="border-b border-slate-200 p-3">
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

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {filteredProducts.map((product) => {
            const proxiedImageUrl = toImageProxyUrl(product.imageUrl);

            return (
              <article
                key={`${product.supplierId}-${product.productId}`}
                className="rounded-xl border border-slate-200"
              >
                {proxiedImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={proxiedImageUrl}
                    alt={product.productName}
                    className="h-44 w-full rounded-t-xl object-cover"
                    loading="lazy"
                    onClick={() =>
                      setPreviewImage({
                        src: proxiedImageUrl,
                        alt: product.productName,
                      })
                    }
                    onError={(event) => {
                      event.currentTarget.src = '/sourcy-si-icon.svg';
                      event.currentTarget.className =
                        'h-44 w-full rounded-t-xl bg-slate-100 object-contain p-6';
                    }}
                  />
                ) : null}
                <div className="space-y-1 p-3">
                  {supplierNameById[product.supplierId] ? (
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {supplierNameById[product.supplierId]}
                    </p>
                  ) : null}
                  <p className="text-sm font-semibold text-slate-800">{product.productName}</p>
                  <p className="text-xs text-slate-500">
                    Price:{' '}
                    <span className="font-medium text-slate-700">
                      {product.priceRange
                        ? `${product.currency ?? ''} ${product.priceRange}`.trim()
                        : 'N/A'}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    MOQ:{' '}
                    <span className="font-medium text-slate-700">
                      {product.moqRange ?? 'N/A'}
                    </span>
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </aside>

      {previewImage ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close image preview"
            onClick={() => setPreviewImage(null)}
          />
          <div className="relative z-10 max-h-[90vh] max-w-4xl overflow-hidden rounded-xl bg-white p-2 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.src}
              alt={previewImage.alt}
              className="max-h-[84vh] w-full rounded-lg object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
