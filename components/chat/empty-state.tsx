'use client';

import Image from 'next/image';

interface EmptyStateProps {
  onSuggestionClick: (value: string) => void;
}

const categories = [
  'Fashion & Apparel',
  'Home & Living',
  'Beauty Packaging',
  'Other Packaging Stuffs',
];

const suggestions = [
  'I want to find suppliers for findings best mugs that can be customized by shape color texture',
  'Where I can find the best supplier for beauty packaging for lipstick tube?',
  'Customized shoes that has an advanced material for sweat absorbant',
];

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="mx-auto flex h-full w-full max-w-4xl items-center justify-center px-4 py-8">
      <div className="w-full rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Image src="/sourcy-logo.svg" alt="Sourcy" width={36} height={36} />
          <h2 className="text-2xl font-semibold text-slate-900">
            Sourcy Supplier Intelligence
          </h2>
        </div>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Find suppliers, compare capabilities, and make informed sourcing
          decisions.
        </p>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Categories
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {categories.join(' · ')}
          </p>
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Try asking
          </p>
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
              >
                <p className="text-sm text-slate-700">{suggestion}</p>
                <button
                  type="button"
                  onClick={() => onSuggestionClick(suggestion)}
                  className="shrink-0 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
