
import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types/types';

interface LoginProps {
  onSuccess: (user: User) => void;
  onNavigate: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await api.login(email, password);
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h2>
        <p className="text-slate-500 mb-6">Enter your credentials to access CivicPulseHub</p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Don't have an account? 
          <button onClick={onNavigate} className="text-blue-600 font-semibold ml-1 hover:underline">Sign up</button>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg text-xs text-blue-800">
        <p className="font-bold mb-1 uppercase">Sample Credentials:</p>
        <ul className="list-disc ml-4 space-y-1">
          <li>Admin: admin@city.gov</li>
          <li>Officer: smith@police.gov</li>
          <li>Citizen: jane@gmail.com</li>
        </ul>
      </div>
    </div>
  );
};

export default Login;
