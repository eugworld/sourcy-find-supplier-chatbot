'use client';

interface ProductCardProps {
  supplierName?: string;
  productName: string;
  imageUrl?: string | null;
  currency?: string | null;
  saleCount?: string | null;
}

export function ProductCard({
  supplierName,
  productName,
  imageUrl,
  currency,
  saleCount,
}: ProductCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {imageUrl ? (
        <div className="block h-40 w-full bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={productName}
            className="h-full w-full object-cover"
            loading="lazy"
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
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Product</span>
          <span>
            {currency ?? '-'} {saleCount ?? ''}
          </span>
        </div>
      </div>
    </article>
  );
}
