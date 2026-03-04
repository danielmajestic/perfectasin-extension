import { useState, type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { currentUser, loading } = useAuth();
  const [isSignup, setIsSignup] = useState(false);

  if (loading) {
    return (
      <div className="min-w-[320px] w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="min-w-[320px] w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Branding */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-800">PerfectASIN</h1>
            <p className="text-xs text-gray-500 mt-1">AI-Powered Amazon Listing Optimization</p>
          </div>

          {/* Auth card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              {isSignup ? 'Create your account' : 'Sign in to continue'}
            </h2>

            {isSignup ? (
              <SignupForm onToggleLogin={() => setIsSignup(false)} />
            ) : (
              <LoginForm onToggleSignup={() => setIsSignup(true)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
