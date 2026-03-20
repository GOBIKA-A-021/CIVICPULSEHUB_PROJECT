import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface SecurityQuestionResetProps {}

const SecurityQuestionReset: React.FC<SecurityQuestionResetProps> = () => {
  const [email, setEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [hint, setHint] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get stored email and security question
    const storedEmail = localStorage.getItem('resetEmail');
    const storedQuestion = localStorage.getItem('securityQuestion');
    const storedHint = localStorage.getItem('securityHint');
    
    if (storedEmail) setEmail(storedEmail);
    if (storedQuestion) setSecurityQuestion(storedQuestion);
    if (storedHint) setHint(storedHint);
    
    if (!storedEmail) {
      setError('No email found. Please start the password reset process again.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!securityAnswer || !newPassword || !confirmPassword) {
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
      await api.resetPasswordBySecurity(email, securityAnswer, newPassword);
      setSuccess(true);
      // Clear localStorage
      localStorage.removeItem('resetEmail');
      localStorage.removeItem('securityQuestion');
      setTimeout(() => window.location.href = '/login', 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
      setLoading(false);
    }
  };

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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
                onClick={() => window.location.href = '/login'}
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
            Security Question
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Answer your security question to reset your password
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow-2xl rounded-3xl border border-slate-200">
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <strong>Email:</strong> {email}
              </p>
            </div>
          </div>

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
              <label className="block text-sm font-black text-slate-700 mb-1.5">
                Security Question
              </label>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700">{securityQuestion}</p>
              </div>
              {hint && (
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <p className="text-xs text-blue-600">
                    <strong>Testing Hint:</strong> {hint}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="securityAnswer" className="block text-sm font-black text-slate-700 mb-1.5">
                Your Answer
              </label>
              <input
                id="securityAnswer"
                name="securityAnswer"
                type="text"
                required
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Enter your answer"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-black text-slate-700 mb-1.5">
                New Password
              </label>
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-black text-slate-700 mb-1.5">
                Confirm New Password
              </label>
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
                onClick={() => window.location.href = '/login'}
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

export default SecurityQuestionReset;
