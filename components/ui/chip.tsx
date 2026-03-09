'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ChipTone = 'default' | 'success' | 'warning';

type ChipProps = {
  children: ReactNode;
  isActive?: boolean;
  tone?: ChipTone;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const toneClassMap: Record<ChipTone, string> = {
  default:
    'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300',
  warning:
    'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300',
};

export function Chip({
  children,
  className,
  isActive = false,
  tone = 'default',
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition ${toneClassMap[tone]} ${isActive ? 'border-teal-500 bg-teal-50 text-teal-700' : ''} ${className ?? ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
