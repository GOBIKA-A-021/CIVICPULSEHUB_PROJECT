import React, { useState, useEffect } from 'react';
import { User, Grievance, GrievanceStatus, Priority } from '../types/types';
import { api } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';

const OfficerDashboard: React.FC<{ user: User; initialView?: string }> = ({ user, initialView }) => {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [activeView, setActiveView] = useState(initialView || 'OVERVIEW');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGrievances();
  }, []);

  useEffect(() => {
    if (initialView) setActiveView(initialView);
  }, [initialView]);

  const loadGrievances = async () => {
    // Backend already filters complaints for the logged-in officer
    // Just get the grievances that the backend returns for this officer
    const officerComplaints = await api.getGrievances();
    console.log(`👮 Officer ${user.name} loaded ${officerComplaints.length} assigned complaints`);
    console.log(`📊 Officer complaints breakdown:`);
    officerComplaints.forEach(g => {
      console.log(`   ${g.id}: ${g.title} - Status: ${g.status} - Category: ${g.category}`);
    });
    setGrievances(officerComplaints);
  };

  const filteredGrievances = grievances.filter(g => {
    if (activeView === 'ASSIGNED') {
      // Show active complaints: PENDING, IN_PROGRESS, REOPENED, RESOLVED, CLOSED
      return g.status === GrievanceStatus.PENDING || g.status === GrievanceStatus.IN_PROGRESS || g.status === GrievanceStatus.REOPENED || g.status === GrievanceStatus.RESOLVED || g.status === GrievanceStatus.CLOSED;
    }
    return true;
  });

  const statusCounts = grievances.reduce((acc: any, g) => {
    acc[g.status] = (acc[g.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(statusCounts).map(status => ({
    name: status.replace('_', ' '),
    value: statusCounts[status]
  }));

  const categoryCounts = grievances.reduce((acc: any, g) => {
    acc[g.category] = (acc[g.category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.keys(categoryCounts).map(cat => ({
    name: cat.replace('_', ' '),
    count: categoryCounts[cat]
  })).sort((a, b) => b.count - a.count);

  const handleProofChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const b64 = await api.uploadImage(e.target.files[0]);
      setProofImage(b64);
    }
  };

  const submitResolution = async () => {
    if (!proofImage) {
      alert("Resolution proof photo is required.");
      return;
    }
    if (!resolvingId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await api.updateGrievance(resolvingId, {
        status: GrievanceStatus.RESOLVED,
        proofImage: proofImage,
        resolutionRemarks: remarks,
        updatedAt: new Date().toISOString()
      });

      setResolvingId(null);
      setProofImage(null);
      setRemarks('');
      loadGrievances();
    } catch (err: any) {
      setError(err.message || 'Failed to submit resolution. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const COLORS = ['#3B82F6', '#6366F1', '#EF4444', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6'];

  const getWeeklyData = () => {
    const weekData: any = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      weekData[dateStr] = { assigned: 0, resolved: 0, closed: 0 };
    }
    grievances.forEach(g => {
      const dateStr = new Date(g.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (weekData[dateStr]) {
        if (g.status === GrievanceStatus.IN_PROGRESS || g.status === GrievanceStatus.PENDING) weekData[dateStr].assigned++;
        if (g.status === GrievanceStatus.RESOLVED) weekData[dateStr].resolved++;
        if (g.status === GrievanceStatus.CLOSED) weekData[dateStr].closed++;
      }
    });
    return Object.keys(weekData).map(date => ({ date, ...weekData[date] }));
  };

  const getMonthlyData = () => {
    const monthData: any = {};
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthData[monthStr] = { assigned: 0, resolved: 0, closed: 0 };
    }
    grievances.forEach(g => {
      const monthStr = new Date(g.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (monthData[monthStr]) {
        if (g.status === GrievanceStatus.IN_PROGRESS || g.status === GrievanceStatus.PENDING) monthData[monthStr].assigned++;
        if (g.status === GrievanceStatus.RESOLVED) monthData[monthStr].resolved++;
        if (g.status === GrievanceStatus.CLOSED) monthData[monthStr].closed++;
      }
    });
    return Object.keys(monthData).map(month => ({ month, ...monthData[month] }));
  };

  const renderOverview = () => {
    const weekData = getWeeklyData();
    const monthData = getMonthlyData();
    
    // Calculate analytics data
    const resolvedComplaints = grievances.filter(g => g.status === GrievanceStatus.RESOLVED || g.status === GrievanceStatus.CLOSED);
    
    // Weekly data (last 4 weeks) - enhanced
    const weeklyData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekResolved = resolvedComplaints.filter(g => {
        const resolvedDate = new Date(g.resolvedAt || g.createdAt);
        return resolvedDate >= weekStart && resolvedDate < weekEnd;
      }).length;
      
      weeklyData.push({
        name: `Week ${4 - i}`,
        resolved: weekResolved,
        total: grievances.filter(g => {
          const createdDate = new Date(g.createdAt);
          return createdDate >= weekStart && createdDate < weekEnd;
        }).length
      });
    }

    // Monthly data (last 6 months) - enhanced
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      const monthResolved = resolvedComplaints.filter(g => {
        const resolvedDate = new Date(g.resolvedAt || g.createdAt);
        return resolvedDate >= monthStart && resolvedDate < monthEnd;
      }).length;
      
      monthlyData.push({
        name: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        resolved: monthResolved,
        total: grievances.filter(g => {
          const createdDate = new Date(g.createdAt);
          return createdDate >= monthStart && createdDate < monthEnd;
        }).length
      });
    }

    // Category-wise resolved data
    const categoryData = Object.entries(
      resolvedComplaints.reduce((acc, g) => {
        acc[g.category] = (acc[g.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([category, count]) => ({ name: category.replace('_', ' '), resolved: count as number }))
    .sort((a, b) => (b.resolved as number) - (a.resolved as number));

    // Resolution rate
    const resolutionRate = grievances.length > 0 ? 
      Math.round((resolvedComplaints.length / grievances.length) * 100) : 0;

    // Average resolution time
    const avgResolutionTime = resolvedComplaints.length > 0 ? 
      Math.round(
        resolvedComplaints.reduce((sum, g) => {
          if (g.resolvedAt && g.createdAt) {
            return sum + (new Date(g.resolvedAt).getTime() - new Date(g.createdAt).getTime());
          }
          return sum;
        }, 0) / resolvedComplaints.length / (1000 * 60 * 60 * 24)
      ) : 0;

    return (
      <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
        {/* Performance Metrics */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">📊 Performance Overview</h2>
          <div className="flex gap-4">
            <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-normal">Resolution Rate</p>
              <p className="text-xl font-black text-emerald-700">{resolutionRate}%</p>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
              <p className="text-[8px] font-black text-blue-600 uppercase tracking-normal">Avg Resolution Time</p>
              <p className="text-xl font-black text-blue-700">{avgResolutionTime} days</p>
            </div>
            <div className="bg-purple-50 px-4 py-2 rounded-xl border border-purple-100">
              <p className="text-[8px] font-black text-purple-600 uppercase tracking-normal">Total Resolved</p>
              <p className="text-xl font-black text-purple-700">{resolvedComplaints.length}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status Distribution */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-normal mb-8">Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                    outerRadius={60}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category-wise Resolutions */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-normal mb-8">🏷️ Category-wise Resolutions</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="resolved"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'][index % 8]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Performance */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-normal mb-8">📈 Weekly Performance (Last 4 Weeks)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
                <Bar dataKey="total" fill="#3b82f6" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Performance */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-normal mb-8">📅 Monthly Performance (Last 6 Months)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
                <Bar dataKey="total" fill="#3b82f6" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Categories Handled */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-normal mb-8">Categories Handled</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="horizontal" margin={{ top: 5, right: 5, left: 180, bottom: 5 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 9, fontWeight: 'bold' }} 
                    width={175}
                    angle={0}
                    textAnchor="end"
                  />
                  <Tooltip cursor={{ fill: '#F8FAFC' }} />
                  <Bar dataKey="resolved" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Resolutions */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-normal mb-6">✅ Recent Resolutions</h3>
            {resolvedComplaints.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 font-medium">No resolved complaints yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resolvedComplaints.slice(0, 5).map(g => (
                  <div key={g.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{g.title}</h4>
                      <p className="text-xs text-slate-600">{g.category} • {g.location}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-normal">
                        {g.status.replace('_', ' ')}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        {g.resolvedAt ? new Date(g.resolvedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAssigned = () => (
    <div className="grid grid-cols-1 gap-8 animate-in slide-in-from-bottom duration-500">
      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Assignments</h2>
      {filteredGrievances.map(g => (
        <div key={g.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
          <div className="w-full md:w-48 h-32 md:h-auto relative bg-slate-100">
            {g.issueImage ? (
              <img src={g.issueImage} className="w-full h-full object-contain" alt="Issue" />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            )}
          </div>

          <div className="flex-1 p-8 flex flex-col">
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{g.title}</h3>
                  <p className="text-sm text-slate-500 mt-2">{g.location}</p>
                </div>
                <span className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-normal border ${
                  g.status === GrievanceStatus.REOPENED ? 'bg-red-50 text-red-600 border-red-100' :
                  g.status === GrievanceStatus.RESOLVED ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                  g.status === GrievanceStatus.CLOSED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  g.status === GrievanceStatus.PENDING ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                  {g.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">{g.description}</p>

              {g.aiSummary && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-[10px] font-black text-blue-600 uppercase mb-1">📋 AI Summary</p>
                  <p className="text-sm text-slate-700">{g.aiSummary}</p>
                </div>
              )}

              {g.aiRecommendation && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-[10px] font-black text-purple-600 uppercase mb-1">💡 Recommended Action</p>
                  <p className="text-sm text-slate-700 font-semibold">{g.aiRecommendation}</p>
                </div>
              )}
            </div>

            <div className="mt-auto pt-8 border-t border-slate-100">
              {resolvingId === g.id ? (
                <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold">
                      {error}
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Resolution Proof Image</label>
                      <div className="relative group h-40">
                        <input type="file" onChange={handleProofChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50 group-hover:bg-slate-100 transition">
                          {proofImage ? (
                            <img src={proofImage} className="w-full h-full object-cover rounded-2xl" alt="Proof" />
                          ) : (
                            <>
                              <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span className="text-[10px] font-bold text-slate-400">Click to upload photo</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Resolution Remarks</label>
                      <textarea 
                        rows={5}
                        placeholder="Describe how the issue was resolved..." 
                        className="w-full text-sm border border-slate-200 rounded-2xl p-4 outline-none focus:ring-4 focus:ring-green-100 transition"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={submitResolution} 
                      disabled={isSubmitting}
                      className={`flex-1 bg-green-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-green-100 hover:bg-green-700 transition ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? 'SUBMITTING...' : 'CONFIRM RESOLUTION'}
                    </button>
                    <button 
                      onClick={() => { setResolvingId(null); setError(null); }} 
                      disabled={isSubmitting}
                      className="px-8 py-4 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {(g.status === GrievanceStatus.IN_PROGRESS || g.status === GrievanceStatus.REOPENED) ? (
                    <button 
                      onClick={() => setResolvingId(g.id)}
                      className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-1 transition active:translate-y-0"
                    >
                      SUBMIT RESOLUTION
                    </button>
                  ) : g.status === GrievanceStatus.RESOLVED ? (
                    <div className="text-center py-4 bg-indigo-50 text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                      Awaiting Citizen Feedback & Rating
                    </div>
                  ) : g.status === GrievanceStatus.PENDING ? (
                    <div className="text-center py-4 bg-amber-50 text-amber-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-100">
                      New Assignment - Review Required
                    </div>
                  ) : g.status === GrievanceStatus.CLOSED ? (
                    <div className="text-center py-4 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                      Task Closed • Resident Satisfied
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAIInsights = () => {
    const selectedComplaint = grievances.find(g => g.id === selectedComplaintId);

    return (
      <div className="space-y-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">AI Insights & Recommendations</h2>
          
          {grievances.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 font-medium">No complaints assigned yet</p>
            </div>
          ) : !selectedComplaintId ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {grievances.map((g) => (
                <div 
                  key={g.id}
                  onClick={() => setSelectedComplaintId(g.id)}
                  className="p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition bg-gradient-to-br from-slate-50 to-white"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-slate-900">{g.title}</h3>
                    <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${
                      g.aiSentiment === 'urgent' ? 'bg-red-100 text-red-600' :
                      g.aiSentiment === 'frustrated' ? 'bg-orange-100 text-orange-600' :
                      g.aiSentiment === 'neutral' ? 'bg-slate-100 text-slate-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {(g.aiSentiment || 'N/A').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">{g.category}</p>
                  <button className="text-blue-600 font-bold text-xs hover:text-blue-700">VIEW INSIGHTS →</button>
                </div>
              ))}
            </div>
          ) : selectedComplaint ? (
            <div className="space-y-6">
              <button 
                onClick={() => setSelectedComplaintId(null)}
                className="text-blue-600 font-bold text-sm hover:text-blue-700"
              >
                ← BACK TO LIST
              </button>

              <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-8 rounded-3xl border border-slate-200">
                <h3 className="text-xl font-black text-slate-900 mb-2">{selectedComplaint.title}</h3>
                <p className="text-slate-600 text-sm mb-6">{selectedComplaint.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Category</p>
                    <p className="text-sm font-bold text-slate-700">{selectedComplaint.category}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Sentiment</p>
                    <p className={`text-sm font-bold ${
                      selectedComplaint.aiSentiment === 'urgent' ? 'text-red-600' :
                      selectedComplaint.aiSentiment === 'frustrated' ? 'text-orange-600' :
                      selectedComplaint.aiSentiment === 'neutral' ? 'text-slate-600' :
                      'text-blue-600'
                    }`}>
                      {(selectedComplaint.aiSentiment || 'N/A').toUpperCase()}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Priority</p>
                    <p className={`text-sm font-bold ${
                      selectedComplaint.aiPriority === 'HIGH' ? 'text-red-600' :
                      selectedComplaint.aiPriority === 'LOW' ? 'text-green-600' :
                      'text-yellow-600'
                    }`}>
                      {selectedComplaint.aiPriority || 'MEDIUM'}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Status</p>
                    <p className={`text-sm font-bold ${
                      selectedComplaint.status === GrievanceStatus.CLOSED ? 'text-green-600 bg-green-50 px-2 py-1 rounded' :
                      selectedComplaint.status === GrievanceStatus.RESOLVED ? 'text-emerald-600 bg-emerald-50 px-2 py-1 rounded' :
                      selectedComplaint.status === GrievanceStatus.IN_PROGRESS ? 'text-blue-600 bg-blue-50 px-2 py-1 rounded' :
                      selectedComplaint.status === GrievanceStatus.PENDING ? 'text-amber-600 bg-amber-50 px-2 py-1 rounded' :
                      selectedComplaint.status === GrievanceStatus.REOPENED ? 'text-red-600 bg-red-50 px-2 py-1 rounded' :
                      'text-slate-700'
                    }`}>
                      {selectedComplaint.status.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {selectedComplaint.aiSummary && (
                  <div className="mb-6 p-4 bg-white rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase mb-2">⚡ AI Summary</p>
                    <p className="text-sm text-slate-700">{selectedComplaint.aiSummary}</p>
                  </div>
                )}

                {selectedComplaint.aiRecommendation && (
                  <div className="mb-6 p-4 bg-white rounded-2xl border border-purple-100">
                    <p className="text-[10px] font-black text-purple-600 uppercase mb-2">💡 Recommended Action</p>
                    <p className="text-sm text-slate-700 font-semibold">{selectedComplaint.aiRecommendation}</p>
                  </div>
                )}

                {selectedComplaint.isDuplicate && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                    <p className="text-[10px] font-black text-amber-600 uppercase mb-2">⚠️ Duplicate Alert</p>
                    <p className="text-sm text-amber-700">Similar complaint: <span className="font-bold">{selectedComplaint.duplicateOf}</span> already reported</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => { setSelectedComplaintId(null); setResolvingId(selectedComplaint.id); setActiveView('ASSIGNED'); }}
                  className="flex-1 bg-blue-600 text-white font-black py-3 rounded-2xl hover:bg-blue-700 transition"
                >
                  RESOLVE THIS ISSUE
                </button>
                <button 
                  onClick={() => setSelectedComplaintId(null)}
                  className="px-8 py-3 rounded-2xl text-slate-500 font-black hover:bg-slate-50 transition"
                >
                  CLOSE
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Task Terminal</h1>
          <p className="text-slate-500 font-medium">Managing {grievances.length} active assignments</p>
        </div>
        
        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex-wrap">
          <button
            onClick={() => setActiveView('OVERVIEW')}
            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${activeView === 'OVERVIEW' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView('ASSIGNED')}
            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${activeView === 'ASSIGNED' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Assigned
          </button>
          <button
            onClick={() => setActiveView('AI_INSIGHTS')}
            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${activeView === 'AI_INSIGHTS' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            🤖 AI Insights
          </button>
        </div>

        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="bg-blue-50 p-3 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</p>
              <p className="text-xl font-black text-slate-900">{grievances.filter(g => g.status === GrievanceStatus.IN_PROGRESS || g.status === GrievanceStatus.REOPENED).length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="bg-emerald-50 p-3 rounded-xl">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
              <p className="text-xl font-black text-slate-900">{grievances.filter(g => g.status === GrievanceStatus.CLOSED).length}</p>
            </div>
          </div>
        </div>
      </div>

      {activeView === 'OVERVIEW' && renderOverview()}
      {activeView === 'ASSIGNED' && renderAssigned()}
      {activeView === 'AI_INSIGHTS' && renderAIInsights()}
    </div>
  );
};

export default OfficerDashboard;
