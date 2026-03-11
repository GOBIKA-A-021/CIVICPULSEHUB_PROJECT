
import React from 'react';
import { User, UserRole } from '../types/types';
import ProfileMenu from './ProfileMenu';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onHome: () => void;
  onDashboard: (view?: string) => void;
  onProfile: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onHome, onDashboard, onProfile }) => {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button onClick={onHome} className="flex items-center space-x-2 focus:outline-none group">
            <div className="bg-blue-600 p-2 rounded-lg group-hover:scale-110 transition">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">CivicPulse<span className="text-blue-600">Hub</span></span>
          </button>

          {user && (
            <div className="hidden md:flex items-center space-x-1 ml-6 border-l border-slate-100 pl-6">
              <button 
                onClick={() => onDashboard('OVERVIEW')} 
                className="px-3 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                Dashboard
              </button>
              
              {user.role === UserRole.CITIZEN && (
                <>
                  <button 
                    onClick={() => onDashboard('SUBMIT')}
                    className="px-3 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    Submit Complaint
                  </button>
                  <button 
                    onClick={() => onDashboard('LIST')}
                    className="px-3 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    My Complaints
                  </button>
                </>
              )}
              
              {user.role === UserRole.OFFICER && (
                <button 
                  onClick={() => onDashboard('ASSIGNED')}
                  className="px-3 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  Assigned Complaints
                </button>
              )}
              
              {user.role === UserRole.ADMIN && (
                <button 
                  onClick={() => onDashboard('MANAGE')}
                  className="px-3 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  Manage System
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <ProfileMenu user={user} onLogout={onLogout} onProfile={onProfile} />
          ) : (
            <div className="flex items-center space-x-4">
              <button onClick={onHome} className="text-slate-600 font-bold text-sm hover:text-blue-600">Explore</button>
              <button onClick={onDashboard} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition">Get Started</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
