import React, { useState } from 'react';
import { IconDollar, IconMoon, IconSun } from '../components/icons';

export default function AuthView({
  theme,
  isDark,
  setIsDark,
  onAuthenticate,
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await onAuthenticate({ username, password, mode });
    if (!result.ok) {
      setError(result.message || 'Unable to continue. Please try again.');
      setIsSubmitting(false);
      return;
    }

    setUsername('');
    setPassword('');
    setIsSubmitting(false);
  };

  const switchTo = mode === 'login' ? 'register' : 'login';

  return (
    <div className={`min-h-dvh ${theme.bg} px-4 py-8 sm:px-6 sm:py-10 flex items-center justify-center`}>
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white"><IconDollar /></div>
            <h1 className={`text-2xl font-bold ${theme.text}`}>WealthMate</h1>
          </div>
          <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full ${theme.card} border`}>
            {isDark ? <IconSun /> : <IconMoon />}
          </button>
        </div>

        <div className={`${theme.card} border rounded-2xl p-6 shadow-sm`}>
          <h2 className={`text-xl font-bold ${theme.text}`}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <p className={`${theme.textMuted} text-sm mt-1`}>
            {mode === 'login'
              ? 'Use your username and password to access your financial dashboard.'
              : 'Set a username and password to protect this app on your device.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className={`block text-xs ${theme.textMuted} mb-1`} htmlFor="auth-username">Username</label>
              <input
                id="auth-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${theme.input}`}
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className={`block text-xs ${theme.textMuted} mb-1`} htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${theme.input}`}
                placeholder="Enter password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </div>

            {error && <div className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{error}</div>}

            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(switchTo);
              setError('');
            }}
            className={`mt-4 w-full text-sm ${theme.textMuted} hover:text-indigo-500 transition-colors`}
          >
            {mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
