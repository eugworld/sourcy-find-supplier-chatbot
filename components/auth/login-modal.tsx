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

  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessWebsite, setBusinessWebsite] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const clearAndClose = () => {
    setError(null);
    setInfo(null);
    onClose();
  };

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    const result = await signIn(identifier, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message ?? 'Invalid email or password.');
      return;
    }

    clearAndClose();
  };

  const handleRegister = async () => {
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    const result = await signUp({
      email,
      password,
      businessName,
      businessWebsite,
      phoneNumber,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message ?? 'Unable to register. That email may already exist.');
      return;
    }

    if (result.requiresEmailConfirmation) {
      setInfo(result.message ?? 'Please check your email to confirm your account.');
      return;
    }

    clearAndClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={clearAndClose}>
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">
            🔒 {mode === 'signin' ? 'Login to continue' : 'Register account'}
          </h2>
          <p className="text-sm text-slate-600">
            {mode === 'signin'
              ? 'You have used your free searches. Login for more daily access.'
              : 'Create an account for daily access and sourcing support.'}
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`rounded-md px-3 py-1.5 ${
              mode === 'signin'
                ? 'bg-white font-semibold text-slate-900 shadow-sm'
                : 'text-slate-600'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`rounded-md px-3 py-1.5 ${
              mode === 'signup'
                ? 'bg-white font-semibold text-slate-900 shadow-sm'
                : 'text-slate-600'
            }`}
          >
            Register
          </button>
        </div>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            if (mode === 'signin') {
              void handleSignIn(event);
              return;
            }

            event.preventDefault();
            void handleRegister();
          }}
        >
          {mode === 'signin' ? (
            <label className="block text-sm font-medium text-slate-700">
              Email or phone number
              <input
                type="text"
                required
                disabled={isSubmitting}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500 placeholder:text-slate-400 focus:ring-2"
                placeholder="you@company.com or +628..."
              />
            </label>
          ) : (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  required
                  autoComplete="email"
                  disabled={isSubmitting}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500 placeholder:text-slate-400 focus:ring-2"
                  placeholder="you@company.com"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Business name
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500 placeholder:text-slate-400 focus:ring-2"
                placeholder="Your company"
              />
            </label>

              <label className="block text-sm font-medium text-slate-700">
                Phone number
                <input
                  type="tel"
                  required
                  disabled={isSubmitting}
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500 placeholder:text-slate-400 focus:ring-2"
                  placeholder="+628123456789"
                />
              </label>
            </>
          )}

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              disabled={isSubmitting}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500 placeholder:text-slate-400 focus:ring-2"
              placeholder="••••••••"
            />
          </label>

          {mode === 'signup' ? (
            <label className="block text-sm font-medium text-slate-700">
              Business website (optional)
              <input
                type="url"
                disabled={isSubmitting}
                value={businessWebsite}
                onChange={(event) => setBusinessWebsite(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500 placeholder:text-slate-400 focus:ring-2"
                placeholder="https://yourcompany.com"
              />
            </label>
          ) : null}

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {info ? <p className="text-sm text-teal-700">{info}</p> : null}

          <div className="flex gap-2">
            <button
              type={mode === 'signin' ? 'submit' : 'button'}
              disabled={isSubmitting}
              onClick={mode === 'signup' ? handleRegister : undefined}
              className="flex-1 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-500"
            >
              {isSubmitting
                ? 'Please wait...'
                : mode === 'signin'
                ? 'Login'
                : 'Register'}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {mode === 'signin' ? 'Register' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
