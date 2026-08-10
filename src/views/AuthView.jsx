import React, { useState } from 'react';
import { IconDollar, IconMoon, IconSun } from '../components/icons';

export default function AuthView({
  theme,
  isDark,
  setIsDark,
  onAuthenticate,
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await onAuthenticate({ password });
    if (!result.ok) {
      setError(result.message || 'Unable to continue. Please try again.');
      setIsSubmitting(false);
      return;
    }

    setPassword('');
    setIsSubmitting(false);
  };

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
          <h2 className={`text-xl font-bold ${theme.text}`}>Owner Sign In</h2>
          <p className={`${theme.textMuted} text-sm mt-1`}>
            Enter your private password to access your financial dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className={`block text-xs ${theme.textMuted} mb-1`} htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${theme.input}`}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>

            {error && <div className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{error}</div>}

            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
