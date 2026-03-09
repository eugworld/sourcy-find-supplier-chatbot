'use client';

import Image from 'next/image';

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
  if (!isOpen) {
    return null;
  }

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

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {products.map((product) => (
            <article key={`${product.supplierId}-${product.productId}`} className="rounded-xl border border-slate-200">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.productName}
                  className="h-44 w-full rounded-t-xl object-cover"
                  loading="lazy"
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
                  {product.currency ?? '-'} {product.saleCount ? `• ${product.saleCount}` : ''}
                </p>
              </div>
            </article>
          ))}
        </div>
      </aside>
    </>
  );
}
