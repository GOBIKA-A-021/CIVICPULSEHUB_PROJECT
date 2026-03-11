import React, { useState } from 'react';
import { User } from '../types/types';

const ProfileWidget: React.FC<{ user: User }> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-72 bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-black mb-4 shadow-lg shadow-blue-100">
              {(user.name || user.username || 'U').charAt(0)}
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1">{user.name || user.username}</h3>
            <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
              {user.role}
            </span>
            <div className="w-full space-y-3 pt-4 border-t border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-widest">Email</span>
                <span className="font-black text-slate-900">{user.email}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-widest">ID</span>
                <span className="font-black text-slate-900">{user.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-white rounded-full shadow-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95 group"
      >
        <div className="w-10 h-10 bg-slate-100 group-hover:bg-blue-50 rounded-full flex items-center justify-center text-sm font-black transition">
          {(user.name || user.username || 'U').charAt(0)}
        </div>
      </button>
    </div>
  );
};

export default ProfileWidget;
