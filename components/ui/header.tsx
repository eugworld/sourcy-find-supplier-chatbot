'use client';

import Image from 'next/image';

import { APP_NAME } from '@/lib/constants';

interface HeaderProps {
  isAuthenticated: boolean;
  remaining: number;
  limit: number;
  isUnlimited?: boolean;
  onLoginClick: () => void;
  onLogout: () => void;
  onRefreshChat: () => void;
}

export function Header({
  isAuthenticated,
  remaining,
  limit,
  isUnlimited = false,
  onLoginClick,
  onLogout,
  onRefreshChat,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Image src="/sourcy-si-icon.svg" alt="Sourcy icon" width={26} height={26} />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-slate-900">
              {APP_NAME}
            </h1>
            <p className="text-xs text-slate-500">
              {isUnlimited
                ? 'Unlimited searches'
                : `${remaining}/${limit} searches remaining today`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onRefreshChat}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Refresh chat
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Logout
            </button>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
              className="rounded-lg border border-teal-300 bg-teal-50 px-2.5 py-1.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
