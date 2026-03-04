import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { trackEvent } from '../utils/analytics';

interface SignupFormProps {
  onToggleLogin: () => void;
}

export default function SignupForm({ onToggleLogin }: SignupFormProps) {
  const { signup } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setError('');
    setLoading(true);
    try {
      await signup();
      trackEvent('signup', { method: 'web_auth_flow' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('cancelled') || msg.includes('canceled')) {
        // User dismissed — silent
      } else {
        setError(msg || 'Sign-up failed. Please try again.');
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
        onClick={handleSignUp}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-200 text-sm"
      >
        {loading ? 'Opening sign-up...' : 'Create Account'}
      </button>

      <p className="text-center text-xs text-gray-500">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onToggleLogin}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
