
import React, { useState } from 'react';
import { api } from '../services/api';
import { UserRole } from '../types/types';

// Department Configuration
const departmentsConfig = {
  ROADS: { name: 'Roads & Infrastructure', designations: ['Field Specialist', 'Senior Inspector', 'Maintenance Supervisor', 'Engineering Technician'] },
  WATER: { name: 'Water Supply', designations: ['Water Inspector', 'Pipe Technician', 'Meter Reader', 'Maintenance Supervisor'] },
  ELECTRICITY: { name: 'Electricity & Power', designations: ['Electrical Inspector', 'Lineman', 'Meter Technician', 'Safety Officer'] },
  SANITATION: { name: 'Sanitation & Waste', designations: ['Sanitation Inspector', 'Waste Collector Supervisor', 'Health Officer', 'Cleanliness Monitor'] },
  PUBLIC_SAFETY: { name: 'Public Safety', designations: ['Safety Officer', 'Traffic Inspector', 'Public Health Officer', 'Community Liaison'] },
  HEALTH: { name: 'Health & Welfare', designations: ['Health Inspector', 'Medical Officer', 'Welfare Officer', 'Public Health Inspector'] },
  PARKS: { name: 'Parks & Recreation', designations: ['Park Supervisor', 'Grounds Maintenance Officer', 'Recreation Coordinator', 'Facility Manager'] },
  EDUCATION: { name: 'Education & Community', designations: ['Community Officer', 'Education Liaison', 'Program Coordinator', 'Outreach Officer'] }
};

interface SignupProps {
  onNavigate: () => void;
}

const Signup: React.FC<SignupProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    role: UserRole.CITIZEN,
    // Officer fields
    department: '',
    departmentKey: '',
    designation: '',
    district: '',
    employeeId: ''
  });
  const [designations, setDesignations] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.password) {
      setError('Password is required');
      return;
    }
    try {
      await api.signup(formData);
      setSuccess(true);
      setTimeout(onNavigate, 1500);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 mb-20">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <div className="text-center mb-8">
          <div className="inline-block bg-blue-100 p-3 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Join CivicPulse</h2>
          <p className="text-slate-500 mt-2">Create your account to start contributing</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6 text-sm flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            Account created! Redirecting to login...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
            <input 
              type="text" 
              required
              placeholder="John Doe"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Username</label>
            <input 
              type="text" 
              required
              placeholder="johndoe123"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="john@example.com"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number</label>
            <input 
              type="tel" 
              placeholder="+91 9876543210"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Register As</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: UserRole.CITIZEN, label: 'Citizen', icon: '👤' },
                { role: UserRole.OFFICER, label: 'Officer', icon: '👮' }
              ].map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => setFormData({...formData, role: item.role})}
                  className={`py-3 rounded-xl border flex flex-col items-center justify-center transition ${
                    formData.role === item.role 
                      ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-100' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl mb-1">{item.icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Officer Specific Fields */}
          {formData.role === UserRole.OFFICER && (
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 space-y-5">
              <h3 className="text-sm font-black text-blue-900 uppercase tracking-wider">Officer Details</h3>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Employee ID</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., EMP123456"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Department</label>
                <select 
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
                  value={formData.departmentKey}
                  onChange={(e) => {
                    const key = e.target.value;
                    const dept = departmentsConfig[key as keyof typeof departmentsConfig];
                    setFormData({
                      ...formData, 
                      departmentKey: key,
                      department: dept?.name || '',
                      designation: '' // Reset designation when department changes
                    });
                    setDesignations(dept?.designations || []);
                  }}
                >
                  <option value="">-- Select Department --</option>
                  {Object.entries(departmentsConfig).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Designation</label>
                <select 
                  required
                  disabled={!formData.departmentKey}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition bg-white disabled:bg-slate-100 disabled:text-slate-400"
                  value={formData.designation}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                >
                  <option value="">-- Select Designation --</option>
                  {designations.map((des) => (
                    <option key={des} value={des}>{des}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">District</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., North, South"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                  />
                </div>
                
              </div>
            </div>
          )}

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition transform active:scale-95 mt-4">
            Create Account
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
          Already a member? 
          <button onClick={onNavigate} className="text-blue-600 font-bold ml-1 hover:underline">Sign in to your account</button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
