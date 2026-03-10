'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }

      if (event.target instanceof Node && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

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

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-700 transition hover:bg-slate-50"
          >
            ☰
          </button>

          {isMenuOpen ? (
            <div className="absolute right-0 top-10 z-30 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  onRefreshChat();
                  setIsMenuOpen(false);
                }}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                Refresh chat
              </button>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Logout
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onLoginClick();
                    setIsMenuOpen(false);
                  }}
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-teal-700 hover:bg-teal-50"
                >
                  Login
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
