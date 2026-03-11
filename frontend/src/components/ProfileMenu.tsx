import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types/types';

interface ProfileMenuProps {
  user: User;
  onLogout: () => void;
  onProfile: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ user, onLogout, onProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setIsOpen(false);
    onProfile();
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  const getInitials = (name: string, username: string) => {
    if (name) {
      const parts = name.split(' ');
      return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
    }
    return username.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(user.name, user.username);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95 border-2 border-white"
        title={`${user.name} (${user.role})`}
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in-0 zoom-in-95">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-2xl shadow-lg">
                {initials}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">{user.name || user.username}</h3>
                <p className="text-blue-100 text-sm">{user.email}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-400">
              <div className="inline-block bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                {user.role}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-4 space-y-3 border-b border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-semibold">Registration ID:</span>
              <span className="text-slate-900 font-mono text-xs bg-slate-50 px-2 py-1 rounded">{user.id}</span>
            </div>
            {user.department && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-semibold">Department:</span>
                <span className="text-slate-900">{user.department}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-semibold">Username:</span>
              <span className="text-slate-900">{user.username}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 space-y-2">
            <button
              onClick={handleProfileClick}
              className="w-full px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50 rounded-lg transition flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>View Profile</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
