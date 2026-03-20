import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface ForgotPasswordProps {
  onNavigate: () => void;
  onNavigateToSecurityQuestion: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate, onNavigateToSecurityQuestion }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Directly use security questions method (no email dependency)
      console.log('🔄 Using security questions method for password reset');
      
      const securityResult = await api.forgotPasswordAlternative(email);
      console.log('✅ API Response:', securityResult);
      
      if (securityResult.securityQuestion) {
        // Store email, security question, and hint for next step
        console.log('✅ Security question found, storing data...');
        localStorage.setItem('resetEmail', email);
        localStorage.setItem('securityQuestion', securityResult.securityQuestion);
        if (securityResult.hint) {
          localStorage.setItem('securityHint', securityResult.hint);
        }
        
        console.log('✅ Data stored, redirecting to security question page');
        
        // Use React navigation instead of window.location.href
        setTimeout(() => {
          onNavigateToSecurityQuestion();
        }, 100);
        return;
      }
      
      if (securityResult.requiresSetup) {
        setError('Security questions not set up for this account. Please contact administrator.');
        setLoading(false);
        return;
      }
      
      // If we get here, show the message from the API
      setSuccess(true);
      setTimeout(onNavigate, 3000);
      
    } catch (err: any) {
      console.error('❌ Security questions method failed:', err);
      setError(err.message || 'Failed to process password reset request. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 animate-in fade-in duration-500">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-black text-slate-900 tracking-tight uppercase">
              Check Your Email
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              If an account with this email exists, you can reset your password using security questions.
            </p>
          </div>
          
          <div className="mt-8 bg-white py-8 px-6 shadow-2xl rounded-3xl border border-slate-200">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a12 12 0 0 1 .673 6.5L12 22l7.89-4.26A12 12 0 0 1 21 12a12 12 0 0 1-7.89 4.26L3 8z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-black text-green-800">Request Processed!</h3>
                  <p className="text-sm text-green-600 mt-1">
                    If the account exists, you can proceed with security questions to reset your password.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={onNavigate}
                className="font-black text-sm text-blue-600 hover:text-blue-500 transition"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 animate-in fade-in duration-500">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-black text-slate-900 tracking-tight uppercase">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Enter your email address to reset your password using security questions
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow-2xl rounded-3xl border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-black text-red-800">Error</h3>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-black text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-black rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8 8 8 0 01 8 8 0 00-8 8zm4-2a1 1 0 00-2 0v1h1a1 1 0 002 0v-1a1 1 0 00-2 0z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Reset Password with Security Questions'
                )}
              </button>
            </div>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={onNavigate}
                className="font-black text-sm text-blue-600 hover:text-blue-500 transition"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
