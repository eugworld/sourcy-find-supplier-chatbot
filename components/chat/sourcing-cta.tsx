'use client';

import { useMemo, useState } from 'react';

interface SourcingCtaProps {
  productNames: string[];
}

export function SourcingCta({ productNames }: SourcingCtaProps) {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [quantity, setQuantity] = useState('');
  const [destination, setDestination] = useState('');

  const whatsappUrl = useMemo(() => {
    const productText = productNames.length > 0 ? productNames.slice(0, 5).join('; ') : 'N/A';

    const text = [
      'Hi Sourcy team, I would like support from a merchandiser.',
      `Products: ${productText}`,
      `Quantity: ${quantity || 'not specified'}`,
      `Destination: ${destination || 'not specified'}`,
      'Please help contact suppliers and provide quotation options.',
    ].join('\n');

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [destination, productNames, quantity]);

  return (
    <section className="rounded-xl border border-teal-100 bg-teal-50/40 p-4">
      <p className="text-sm font-medium text-slate-800">
        Would you like to source this? Sourcy can help to talk suppliers and get you the quotation in 2 days.
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setAccepted(true)}
          className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white"
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => setAccepted(false)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
        >
          No
        </button>
      </div>

      {accepted ? (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Quantity
            <input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="e.g. 2000 pcs"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-400"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Destination (City, Country)
            <input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="e.g. Jakarta, Indonesia"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-400"
            />
          </label>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
          >
            Contact Sourcy merchandiser
          </a>
        </div>
      ) : null}
    </section>
  );
}
