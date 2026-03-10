'use client';

import { useMemo } from 'react';

interface SourcingCtaProps {
  productNames: string[];
  quantity: string;
  destination: string;
  onGetQuote: () => void;
  onQuantityChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  isCollectingDetails: boolean;
  requestText: string;
}

export function SourcingCta({
  productNames,
  quantity,
  destination,
  onGetQuote,
  onQuantityChange,
  onDestinationChange,
  isCollectingDetails,
  requestText,
}: SourcingCtaProps) {
  const whatsappUrl = useMemo(() => {
    const productText = productNames.length > 0 ? productNames.slice(0, 5).join('; ') : 'N/A';

    const text = [
      'Hi Sourcy team, please help me get a quotation.',
      `Request: ${requestText || 'Supplier sourcing request'}`,
      `Products: ${productText}`,
      `Quantity: ${quantity}`,
      `Destination: ${destination}`,
    ].join('\n');

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [destination, productNames, quantity, requestText]);

  const hasCompleteDetails = Boolean(quantity.trim() && destination.trim());

  return (
    <section className="rounded-xl border border-teal-100 bg-teal-50/40 p-4">
      <p className="text-sm font-medium text-slate-800">
        Would you like to source this? Sourcy can help to talk suppliers and get you the quotation in 2 days.
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onGetQuote}
          className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white"
        >
          Get quote
        </button>
      </div>

      {isCollectingDetails ? (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Quantity
            <input
              value={quantity}
              onChange={(event) => onQuantityChange(event.target.value)}
              placeholder="e.g. 2000 pcs"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-400"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Destination (City, Country)
            <input
              value={destination}
              onChange={(event) => onDestinationChange(event.target.value)}
              placeholder="e.g. Jakarta, Indonesia"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-400"
            />
          </label>

          {hasCompleteDetails ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
            >
              Contact Sourcy merchandiser
            </a>
          ) : (
            <p className="text-xs text-slate-600">
              Please provide quantity and destination to continue to WhatsApp.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
