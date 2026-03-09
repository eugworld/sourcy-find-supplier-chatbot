'use client';

import { FormEvent, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { Modal } from '@/components/ui/modal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signIn, signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const clearAndClose = () => {
    setError(null);
    onClose();
  };

  const handleSignIn = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!signIn(email, password)) {
      setError('Invalid email or password.');
      return;
    }

    clearAndClose();
  };

  const handleRegister = () => {
    setError(null);

    if (!signUp(email, password)) {
      setError('Unable to register. That email may already exist.');
      return;
    }

    clearAndClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={clearAndClose}>
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">🔒 Sign in to continue</h2>
          <p className="text-sm text-slate-600">
            You have used your free searches. Sign in for more daily access.
          </p>
        </div>

        <form className="space-y-3" onSubmit={handleSignIn}>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500 placeholder:text-slate-400 focus:ring-2"
              placeholder="you@company.com"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500 placeholder:text-slate-400 focus:ring-2"
              placeholder="••••••••"
            />
          </label>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-500"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={handleRegister}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Register
            </button>
          </div>
        </form>

        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Demo: <span className="font-semibold">demo@sourcy.ai / demo123</span>
        </p>
      </div>
    </Modal>
  );
}
