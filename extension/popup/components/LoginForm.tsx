import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { resetPassword } from '../auth/web-auth-flow';
import { trackEvent } from '../utils/analytics';

interface LoginFormProps {
  onToggleSignup: () => void;
}

export default function LoginForm({ onToggleSignup }: LoginFormProps) {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setError('');
    setLoading(true);
    try {
      await login();
      trackEvent('login', { method: 'web_auth_flow' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('cancelled') || msg.includes('canceled')) {
        // User dismissed — silent
      } else {
        setError(msg || 'Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-200 text-sm"
      >
        {loading ? 'Opening sign-in...' : 'Sign In'}
      </button>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => resetPassword()}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Forgot password?
        </button>
        <button
          type="button"
          onClick={onToggleSignup}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Create account
        </button>
      </div>
    </div>
  );
}
