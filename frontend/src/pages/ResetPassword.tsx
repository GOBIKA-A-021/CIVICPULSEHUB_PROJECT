import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface ResetPasswordProps {}

const ResetPassword: React.FC<ResetPasswordProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(true);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid or expired reset link');
      setTokenValid(false);
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await api.resetPassword(token!, email!, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 animate-in fade-in duration-500">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-black text-red-900 tracking-tight uppercase">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-red-600">
              This password reset link is invalid or has expired.
            </p>
          </div>
          
          <div className="mt-8 bg-white py-8 px-6 shadow-2xl rounded-3xl border border-red-200">
            <div className="text-center">
              <button
                onClick={() => navigate('/forgot-password')}
                className="font-black text-sm text-red-600 hover:text-red-500 transition"
              >
                Request New Reset Link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 animate-in fade-in duration-500">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-black text-green-900 tracking-tight uppercase">
              Password Reset Successful
            </h2>
            <p className="mt-2 text-sm text-green-600">
              Your password has been reset successfully.
            </p>
          </div>
          
          <div className="mt-8 bg-white py-8 px-6 shadow-2xl rounded-3xl border border-green-200">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7l-7 7-7-7-1.41z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 2v6m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-black text-green-800">Password Changed!</h3>
                  <p className="text-sm text-green-600 mt-1">
                    You can now login with your new password.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={() => navigate('/login')}
                className="font-black text-sm text-green-600 hover:text-green-500 transition"
              >
                Go to Login
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
            Enter your new password below
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
              <label htmlFor="newPassword" className="block text-sm font-black text-slate-700 mb-1.5">
                New Password
              </label>
              <div className="mt-1">
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-black text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8 8 0 01 8 8 0 00-8 8zm4-2a1 1 0 00-2 0v1h1a1 1 0 002 0v-1a1 1 0 00-2 0z"></path>
                    </svg>
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-black text-sm text-blue-600 hover:text-blue-500 transition"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
};

export default ResetPassword;
