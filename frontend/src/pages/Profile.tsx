
import React, { useState } from 'react';
import { User } from '../types/types';
import { api } from '../services/api';

const Profile: React.FC<{ user: User; onUpdate: (user: User) => void }> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    username: user.username,
    department: user.department || ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      // In a real app, we'd have an API endpoint for this
      // For now, we'll simulate it and update local storage
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('civic_pulse_user', JSON.stringify(updatedUser));
      onUpdate(updatedUser);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-blue-600 h-32 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-lg">
              <div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center text-3xl font-black text-blue-600">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-16 p-8 md:p-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{user.name}</h1>
              <p className="text-slate-500 font-medium">@{user.username} • {user.role}</p>
            </div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest transition"
              >
                Edit Profile
              </button>
            )}
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-2xl text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {message.text}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input 
                    required
                    className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 transition"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                  <input 
                    required
                    type="email"
                    className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 transition"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Username</label>
                  <input 
                    required
                    className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 transition"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                {user.role !== 'CITIZEN' && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Department</label>
                    <input 
                      className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 transition"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    />
                  </div>
                )}
              </div>
              <div className="flex space-x-4 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition"
                >
                  SAVE CHANGES
                </button>
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-200 transition"
                >
                  CANCEL
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                <p className="font-bold text-slate-900">{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Type</p>
                <p className="font-bold text-slate-900">{user.role}</p>
              </div>
              {user.department && (
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</p>
                  <p className="font-bold text-slate-900">{user.department}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Since</p>
                <p className="font-bold text-slate-900">March 2024</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
