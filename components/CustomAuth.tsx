'use client';

import { useState } from 'react';
import { signIn, signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import KinisiLogo from './KinisiLogo';

interface CustomAuthProps {
  onAuthSuccess: (user: any) => void;
}

export default function CustomAuth({ onAuthSuccess }: CustomAuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { isSignedIn } = await signIn({
        username: email,
        password: password,
      });
      
      if (isSignedIn) {
        onAuthSuccess({ email });
      }
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signUp({
        username: email,
        password: password,
        options: {
          userAttributes: {
            email: email,
          },
        },
      });
      setIsConfirming(true);
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await confirmSignUp({
        username: email,
        confirmationCode: confirmCode,
      });
      setIsConfirming(false);
      setIsSignUp(false);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      await resendSignUpCode({ username: email });
      setError('Confirmation code sent!');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  if (isConfirming) {
    return (
      <div className="flex min-h-full flex-col justify-center bg-gray-50 dark:bg-gray-900 px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="flex items-center justify-center gap-2 mb-6">
            <KinisiLogo className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kinisi</h1>
          </div>
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Confirm your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            We sent a confirmation code to {email}
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" onSubmit={handleConfirmSignUp}>
            <div>
              <label htmlFor="confirmCode" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                Confirmation Code
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-gray-50 dark:bg-gray-700 pl-3 outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-amber-500">
                  <input
                    id="confirmCode"
                    name="confirmCode"
                    type="text"
                    required
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value)}
                    placeholder="Enter confirmation code"
                    className="block min-w-0 grow bg-transparent py-1.5 pl-1 pr-3 text-base text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-amber-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:opacity-50"
              >
                {loading ? 'Confirming...' : 'Confirm Account'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="text-sm text-amber-600 hover:text-amber-500 disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col justify-center bg-gray-50 dark:bg-gray-900 px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <KinisiLogo className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kinisi</h1>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={isSignUp ? handleSignUp : handleSignIn}>
          <div>
            <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
              Email
            </label>
            <div className="mt-2">
              <div className="flex items-center rounded-md bg-gray-50 dark:bg-gray-700 pl-3 outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-amber-500">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="block min-w-0 grow bg-transparent py-1.5 pl-1 pr-3 text-base text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
              Password
            </label>
            <div className="mt-2">
              <div className="flex items-center rounded-md bg-gray-50 dark:bg-gray-700 pl-3 outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-amber-500">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block min-w-0 grow bg-transparent py-1.5 pl-1 pr-3 text-base text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-amber-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:opacity-50"
            >
              {loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create account' : 'Sign in')}
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm/6 text-gray-600 dark:text-gray-300">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="font-semibold text-amber-600 hover:text-amber-500"
          >
            {isSignUp ? 'Sign in' : 'Create account'}
          </button>
        </p>
      </div>
    </div>
  );
}
