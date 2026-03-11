
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types/types';
import { api } from './services/api';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import ProfileWidget from './components/ProfileWidget';

type Page = 'HOME' | 'LOGIN' | 'SIGNUP' | 'DASHBOARD' | 'PROFILE';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('HOME');
  const [dashboardView, setDashboardView] = useState<string>('OVERVIEW');

  useEffect(() => {
    const auth = api.getAuth();
    if (auth) {
      setUser(auth);
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setUser(user);
    setCurrentPage('DASHBOARD');
    setDashboardView('OVERVIEW');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCurrentPage('HOME');
  };

  const handleDashboardNavigation = (view?: string) => {
    setCurrentPage('DASHBOARD');
    if (view) setDashboardView(view);
  };

  const handleProfileNavigation = () => {
    setCurrentPage('PROFILE');
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'HOME':
        return <Home 
          onLogin={() => setCurrentPage('LOGIN')} 
          onSignup={() => setCurrentPage('SIGNUP')} 
          isLoggedIn={!!user}
          onDashboard={() => handleDashboardNavigation('OVERVIEW')}
        />;
      case 'LOGIN':
        return <Login onSuccess={handleLoginSuccess} onNavigate={() => setCurrentPage('SIGNUP')} />;
      case 'SIGNUP':
        return <Signup onNavigate={() => setCurrentPage('LOGIN')} />;
      case 'DASHBOARD':
        if (!user) return <Login onSuccess={handleLoginSuccess} onNavigate={() => setCurrentPage('SIGNUP')} />;
        switch (user.role) {
          case UserRole.ADMIN: return <AdminDashboard user={user} initialView={dashboardView} />;
          case UserRole.OFFICER: return <OfficerDashboard user={user} initialView={dashboardView} />;
          case UserRole.CITIZEN: return <CitizenDashboard user={user} initialView={dashboardView as any} />;
          default: return <div>Invalid Role</div>;
        }
      case 'PROFILE':
        if (!user) return <Login onSuccess={handleLoginSuccess} onNavigate={() => setCurrentPage('SIGNUP')} />;
        return <Profile user={user} onUpdate={(updatedUser) => setUser(updatedUser)} />;
      default:
        return <Home 
          onLogin={() => setCurrentPage('LOGIN')} 
          onSignup={() => setCurrentPage('SIGNUP')} 
          isLoggedIn={!!user}
          onDashboard={() => handleDashboardNavigation('OVERVIEW')}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onHome={() => setCurrentPage('HOME')}
        onDashboard={handleDashboardNavigation}
        onProfile={handleProfileNavigation}
      />
      {user && <ProfileWidget user={user} onLogout={handleLogout} />}
      <main className="flex-grow container mx-auto py-8 px-4">
        {renderContent()}
      </main>
      <footer className="py-6 border-t border-slate-200 text-center text-slate-400 text-xs">
        &copy; 2024 CivicPulseHub. Built for transparent governance.
      </footer>
    </div>
  );
};

export default App;
