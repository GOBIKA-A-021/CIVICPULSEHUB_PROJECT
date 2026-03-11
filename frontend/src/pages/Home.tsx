
import React from 'react';

interface HomeProps {
  onLogin: () => void;
  onSignup: () => void;
  isLoggedIn: boolean;
  onDashboard: () => void;
}

const Home: React.FC<HomeProps> = ({ onLogin, onSignup, isLoggedIn, onDashboard }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 md:py-24">
      <div className="text-center space-y-6">
        <div className="inline-block bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase mb-4">
          Empowering Communities
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight">
          Transparency in <span className="text-blue-600 italic">Civic</span> Grievances
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          CivicPulseHub bridges the gap between citizens and administration. Report issues, track resolutions, and ensure your neighborhood thrives.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          {isLoggedIn ? (
            <button 
              onClick={onDashboard}
              className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1"
            >
              Back to Dashboard
            </button>
          ) : (
            <>
              <button 
                onClick={onLogin}
                className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1"
              >
                Log In Now
              </button>
              <button 
                onClick={onSignup}
                className="bg-white text-slate-900 border-2 border-slate-200 px-10 py-4 rounded-xl font-bold text-lg hover:border-blue-600 hover:text-blue-600 transition"
              >
                Create Account
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-24">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-6">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Easy Reporting</h3>
          <p className="text-slate-500">Submit issues with photos and precise locations in seconds.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-6">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Verified Resolution</h3>
          <p className="text-slate-500">Officers must provide photo proof for every resolved complaint.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mb-6">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Citizen Feedback</h3>
          <p className="text-slate-500">Not happy? Reopen the ticket with one click to ensure accountability.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
