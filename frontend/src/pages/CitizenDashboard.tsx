
import React, { useState, useEffect } from 'react';
import { User, Grievance, Priority, GrievanceStatus } from '../types/types';
import { api, CATEGORIES } from '../services/api';
import { aiService } from '../services/aiService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';

const StarRating: React.FC<{ rating: number; onRate?: (r: number) => void; interactive?: boolean }> = ({ rating, onRate, interactive = false }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate && onRate(star)}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        >
          <svg
            className={`w-6 h-6 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
};

const CitizenDashboard: React.FC<{ user: User; initialView?: 'LIST' | 'SUBMIT' | 'OVERVIEW' }> = ({ user, initialView = 'OVERVIEW' }) => {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [activeView, setActiveView] = useState<'LIST' | 'SUBMIT' | 'OVERVIEW'>(initialView);
  const [issueImage, setIssueImage] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reopeningId, setReopeningId] = useState<string | null>(null);
  const [reopenFeedback, setReopenFeedback] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiInsights, setAiInsights] = useState<{ summary?: string; estimatedTime?: string; sentiment?: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    priority: Priority.MEDIUM,
    location: '',
    deadlineDate: ''
  });

  useEffect(() => {
    loadGrievances();
    
    // Set up periodic refresh to get latest status updates
    const interval = setInterval(() => {
      loadGrievances();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (initialView) setActiveView(initialView);
  }, [initialView]);

  // Auto-process description with AI using backend endpoints
  useEffect(() => {
    const processDescription = async () => {
      if (formData.description.length > 20 && !aiProcessing) {
        setAiProcessing(true);
        try {
          console.log('🤖 Starting AI processing for description:', formData.description);
          
          // Run AI tasks in parallel using backend endpoints
          const [detectedCategory, priority, summary, sentiment] = await Promise.all([
            api.categorizeComplaint(formData.description),
            api.detectPriority(formData.description, formData.category),
            api.summarizeComplaint(formData.description),
            api.analyzeSentiment(formData.description)
          ]);

          console.log('✅ AI Results:', { detectedCategory, priority, summary, sentiment });

          // Update form with AI suggestions
          setFormData(prev => ({
            ...prev,
            category: detectedCategory,
            priority
          }));

          setAiInsights({
            summary,
            sentiment,
            estimatedTime: 'Analyzing...' // Placeholder
          });
        } catch (error) {
          console.error('❌ AI processing error:', error);
          console.error('Error details:', error.message);
          
          // Show user feedback that AI processing failed
          setAiInsights({
            summary: 'AI processing unavailable',
            sentiment: 'neutral',
            estimatedTime: 'N/A'
          });
        } finally {
          setAiProcessing(false);
        }
      }
    };

    // Debounce AI processing
    const timer = setTimeout(processDescription, 1500);
    return () => clearTimeout(timer);
  }, [formData.description, formData.category, aiProcessing]);

  const loadGrievances = async () => {
    const all = await api.getGrievances();
    setGrievances(all);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const b64 = await api.uploadImage(e.target.files[0]);
      setIssueImage(b64);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await api.submitGrievance({
        ...formData,
        issueImage: issueImage || undefined,
        citizenId: user.id
      });
      setFormData({ title: '', description: '', category: CATEGORIES[0], priority: Priority.MEDIUM, location: '', deadlineDate: '' });
      setIssueImage(null);
      setActiveView('LIST');
      loadGrievances();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedback = async (id: string, satisfied: boolean) => {
    if (!satisfied) {
      setReopeningId(id);
      return;
    }

    await api.updateGrievance(id, {
      status: GrievanceStatus.CLOSED,
      isSatisfied: true,
      rating: rating,
      updatedAt: new Date().toISOString()
    });
    setRating(0);
    loadGrievances();
  };

  const submitReopen = async () => {
    if (!reopeningId || !reopenFeedback) return;

    await api.updateGrievance(reopeningId, {
      status: GrievanceStatus.REOPENED,
      isSatisfied: false,
      feedbackMessage: reopenFeedback,
      updatedAt: new Date().toISOString()
    });
    setReopeningId(null);
    setReopenFeedback('');
    loadGrievances();
  };



  const handleDownloadPDF = async (id: string) => {
    try {
      await api.downloadComplaintPDF(id);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to download PDF');
    }
  };

  const getStatusStyle = (status: GrievanceStatus) => {
    switch (status) {
      case GrievanceStatus.PENDING: return 'bg-amber-50 text-amber-700 border-amber-100';
      case GrievanceStatus.IN_PROGRESS: return 'bg-blue-50 text-blue-700 border-blue-100';
      case GrievanceStatus.RESOLVED: return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case GrievanceStatus.REOPENED: return 'bg-red-50 text-red-700 border-red-100';
      case GrievanceStatus.CLOSED: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
  };

  // Chart Data
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

  const barData = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    count: categoryCounts[cat]
  }));

  const COLORS = ['#F59E0B', '#3B82F6', '#6366F1', '#EF4444', '#10B981', '#EC4899', '#8B5CF6', '#14B8A6'];

  const renderOverview = () => {
    const priorityCounts = grievances.reduce((acc: any, g) => {
      acc[g.priority] = (acc[g.priority] || 0) + 1;
      return acc;
    }, {});

    const priorityData = Object.keys(priorityCounts).map(pri => ({
      name: pri,
      value: priorityCounts[pri]
    }));

    const categoryData = Object.keys(categoryCounts).map(cat => ({
      name: cat,
      count: categoryCounts[cat]
    })).sort((a, b) => b.count - a.count);

    const resolutionRate = grievances.length > 0 
      ? Math.round((grievances.filter(g => g.status === GrievanceStatus.CLOSED || g.status === GrievanceStatus.RESOLVED).length / grievances.length) * 100) 
      : 0;

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-3xl border border-blue-200 shadow-sm">
            <h3 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-4">Total Reports</h3>
            <p className="text-4xl font-black text-blue-900">{grievances.length}</p>
            <div className="mt-4 h-1 w-full bg-blue-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: '100%' }} />
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-3xl border border-emerald-200 shadow-sm">
            <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-4">Resolved</h3>
            <p className="text-4xl font-black text-emerald-700">
              {grievances.filter(g => g.status === GrievanceStatus.CLOSED || g.status === GrievanceStatus.RESOLVED).length}
            </p>
            <div className="mt-4 h-1 w-full bg-emerald-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: `${resolutionRate}%` }} />
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-3xl border border-indigo-200 shadow-sm">
            <h3 className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-4">In Progress</h3>
            <p className="text-4xl font-black text-indigo-700">
              {grievances.filter(g => g.status === GrievanceStatus.IN_PROGRESS).length}
            </p>
            <div className="mt-4 h-1 w-full bg-indigo-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600" style={{ width: `${(grievances.filter(g => g.status === GrievanceStatus.IN_PROGRESS).length / (grievances.length || 1)) * 100}%` }} />
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-3xl border border-orange-200 shadow-sm">
            <h3 className="text-xs font-black text-orange-700 uppercase tracking-widest mb-4">Pending</h3>
            <p className="text-4xl font-black text-orange-700">
              {grievances.filter(g => g.status === GrievanceStatus.PENDING).length}
            </p>
            <div className="mt-4 h-1 w-full bg-orange-200 rounded-full overflow-hidden">
              <div className="h-full bg-orange-600" style={{ width: `${(grievances.filter(g => g.status === GrievanceStatus.PENDING).length / (grievances.length || 1)) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-8">Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-8">Priority Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#EF4444', '#F59E0B', '#10B981'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-8">Resolution Rate</h3>
            <div className="h-64 flex flex-col items-center justify-center">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-8 border-slate-200" />
                <div 
                  className="absolute inset-0 rounded-full border-8 border-transparent border-t-blue-600 border-r-blue-600"
                  style={{
                    transform: `rotate(${resolutionRate * 3.6}deg)`
                  }}
                />
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-slate-900">{resolutionRate}%</span>
                  <span className="text-xs font-bold text-slate-500 mt-2">Resolved</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-8">Reports by Category</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', angle: -45 }} height={80} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6">Top Categories</h3>
            <div className="space-y-4">
              {categoryData.slice(0, 5).map((cat, idx) => (
                <div key={cat.name} className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0">
                  <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-100 rounded-full px-3 py-1 text-xs font-black text-slate-600">{cat.count}</div>
                    <div className="w-full bg-slate-100 rounded-full h-2 w-24">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${(cat.count / (categoryData[0]?.count || 1)) * 100}%`,
                          backgroundColor: COLORS[idx % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6">Status Stats</h3>
            <div className="space-y-4">
              {[
                { label: 'Pending', value: grievances.filter(g => g.status === GrievanceStatus.PENDING).length, color: 'text-amber-600' },
                { label: 'In Progress', value: grievances.filter(g => g.status === GrievanceStatus.IN_PROGRESS).length, color: 'text-blue-600' },
                { label: 'Resolved', value: grievances.filter(g => g.status === GrievanceStatus.RESOLVED).length, color: 'text-indigo-600' },
                { label: 'Closed', value: grievances.filter(g => g.status === GrievanceStatus.CLOSED).length, color: 'text-emerald-600' }
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0">
                  <span className="text-sm font-bold text-slate-700">{stat.label}</span>
                  <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            {activeView === 'LIST' ? 'My Civic Reports' : activeView === 'SUBMIT' ? 'New Grievance Report' : 'Citizen Dashboard'}
          </h1>
          <p className="text-slate-500 font-medium">
            {activeView === 'LIST' ? `You have ${grievances.length} active submissions` : activeView === 'SUBMIT' ? 'Provide details about the issue in your area' : 'Overview of your civic engagement'}
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <button 
            onClick={() => setActiveView('OVERVIEW')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${activeView === 'OVERVIEW' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveView('LIST')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${activeView === 'LIST' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Tracking
          </button>
          <button 
            onClick={() => setActiveView('SUBMIT')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${activeView === 'SUBMIT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            New Report
          </button>
        </div>
      </div>

      {activeView === 'OVERVIEW' && renderOverview()}

      {activeView === 'SUBMIT' && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 md:p-12">
            {submitError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-bold flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                {submitError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">Complaint Headline</label>
                <input required className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition text-lg" 
                  placeholder="e.g. Sewage overflow on Oak Street"
                  value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>

              {/* AI Insights Display */}
              {aiInsights && (
                <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 animate-in fade-in">
                  <div className="flex items-center mb-4">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    <h4 className="font-black text-blue-900 text-sm uppercase tracking-wider">AI INSIGHTS</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Summary</p>
                      <p className="text-slate-700 font-medium">{aiInsights.summary}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Sentiment</p>
                      <p className="text-slate-700 font-medium capitalize">{aiInsights.sentiment}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Est. Resolution</p>
                      <p className="text-slate-700 font-medium">{aiInsights.estimatedTime}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">Issue Category (AI-Suggested)</label>
                  <div className="flex items-center gap-2">
                    <select className="flex-1 px-5 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition" 
                      value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {aiProcessing && <span className="text-blue-600 text-xs font-black animate-pulse">🤖 Processing...</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">Priority Level (AI-Assessed)</label>
                  <select className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition font-bold text-blue-600" 
                    value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value as Priority})}>
                    <option value={Priority.LOW}>Low - Routine</option>
                    <option value={Priority.MEDIUM}>Medium - Urgent</option>
                    <option value={Priority.HIGH}>High - Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">Exact Location</label>
                  <input required className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition" 
                    placeholder="Area, Street, Landmark..."
                    value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">Expected Resolution Deadline</label>
                  <input type="date" className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition" 
                    value={formData.deadlineDate} onChange={(e) => setFormData({...formData, deadlineDate: e.target.value})} />
                  <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">Optional: Set a deadline for resolution</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">Full Description</label>
                  <textarea required rows={5} className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition" 
                    placeholder="Describe the problem in detail... (AI will analyze as you type)"
                    value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  <p className="text-[10px] text-blue-500 mt-1 font-bold uppercase tracking-wider">💡 AI auto-detects category & priority</p>
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">Evidence Photo</label>
                  <div className="relative group">
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50 group-hover:bg-slate-100 transition">
                      {issueImage ? (
                        <img src={issueImage} className="w-full h-full object-cover rounded-2xl" alt="Preview" />
                      ) : (
                        <>
                          <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="text-xs font-bold text-slate-500">Click to upload photo</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2 pt-6 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`bg-blue-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition active:translate-y-0 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'SUBMITTING...' : 'FILE COMPLAINT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeView === 'LIST' && (
        <div className="space-y-6 pb-24">
          {reopeningId && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-300">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">Reopen Complaint</h3>
                <p className="text-sm text-slate-500 mb-6 font-medium">Please describe why the issue is not resolved to your satisfaction.</p>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-100 transition mb-6"
                  placeholder="What was missed? What still needs attention?"
                  value={reopenFeedback}
                  onChange={(e) => setReopenFeedback(e.target.value)}
                />
                <div className="flex space-x-3">
                  <button 
                    onClick={submitReopen}
                    className="flex-1 bg-red-600 text-white font-black py-4 rounded-2xl hover:bg-red-700 transition shadow-lg shadow-red-100"
                  >
                    REOPEN CASE
                  </button>
                  <button 
                    onClick={() => { setReopeningId(null); setReopenFeedback(''); }}
                    className="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-200 transition"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          )}
          {grievances.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200">
               <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-1">No active reports</h3>
               <p className="text-slate-400">Your civic engagement helps build a better city.</p>
               <button onClick={() => setActiveView('SUBMIT')} className="mt-8 text-blue-600 font-bold hover:underline">Start your first report →</button>
            </div>
          ) : grievances.map(g => (
            <div key={g.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden group">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-64 h-48 md:h-auto relative overflow-hidden bg-slate-100 border-r border-slate-100">
                  {g.issueImage ? (
                    <img src={g.issueImage} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="Issue" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-20">
                       <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black text-blue-600 shadow-sm">{g.id}</span>
                  </div>
                </div>
                
                <div className="p-6 md:p-8 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{g.title}</h3>
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span>{g.category}</span>
                        <span>•</span>
                        <span>{g.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getStatusStyle(g.status)}`}>
                        {g.status.replace('_', ' ')}
                      </span>
                      <button 
                        onClick={() => handleDownloadPDF(g.id)}
                        className="p-3 hover:bg-blue-50 rounded-full transition text-slate-400 hover:text-blue-600 group relative"
                        title="Download PDF"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 whitespace-nowrap bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none">Download PDF</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-2 mb-6 leading-relaxed">{g.description}</p>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex -space-x-2">
                       <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">JD</div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SUBMITTED {new Date(g.createdAt).toLocaleDateString()}</span>
                  </div>

                  {g.status === GrievanceStatus.RESOLVED && (
                    <div className="mt-8 pt-8 border-t-2 border-dashed border-slate-100 animate-in fade-in zoom-in duration-300">
                      <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100">
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center space-x-2">
                             <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs">✓</div>
                             <h4 className="font-black text-indigo-900 text-sm uppercase tracking-wider">Resolution Proof Uploaded</h4>
                           </div>
                           <div className="text-right">
                             <span className="text-[10px] font-bold text-indigo-400 block">By {g.assignedOfficer || 'Officer'}</span>
                             <span className="text-[10px] font-bold text-emerald-600 block">
                               Resolved: {
                                 (() => {
                                   console.log('🔍 Debug - Complaint data:', g);
                                   console.log('🔍 Debug - resolvedAt value:', g.resolvedAt);
                                   console.log('🔍 Debug - updatedAt value:', g.updatedAt);
                                   
                                   // Try resolvedAt first, then updatedAt as fallback
                                   const timestamp = g.resolvedAt || g.updatedAt;
                                   console.log('🔍 Debug - using timestamp:', timestamp);
                                   console.log('🔍 Debug - timestamp type:', typeof timestamp);
                                   
                                   if (timestamp) {
                                     const date = new Date(timestamp);
                                     console.log('🔍 Debug - parsed date:', date);
                                     console.log('🔍 Debug - is valid date:', !isNaN(date.getTime()));
                                     if (!isNaN(date.getTime())) {
                                       return date.toLocaleDateString('en-US', { 
                                         year: 'numeric', 
                                         month: 'short', 
                                         day: 'numeric' 
                                       });
                                     }
                                   }
                                   return 'Processing...';
                                 })()
                               }
                             </span>
                           </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-6 items-start">
                          {g.proofImage && (
                            <div className="relative group cursor-zoom-in">
                              <img src={g.proofImage} className="w-full h-48 object-cover rounded-2xl shadow-lg border-2 border-white" alt="Proof" />
                              <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/20 transition rounded-2xl" />
                            </div>
                          )}
                          <div className="space-y-4">
                            <p className="text-sm text-slate-600 italic bg-white p-4 rounded-2xl border border-indigo-50 shadow-sm leading-relaxed">
                              "{g.resolutionRemarks || 'Issue resolved according to standards.'}"
                            </p>
                            
                            <div className="bg-white p-4 rounded-2xl border border-indigo-50 shadow-sm">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rate the Resolution</label>
                              <StarRating rating={rating} onRate={setRating} interactive={true} />
                            </div>

                            <div className="flex space-x-3">
                              <button 
                                onClick={() => handleFeedback(g.id, true)}
                                className="flex-1 bg-indigo-600 text-white font-black py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition"
                              >
                                Accept & Close
                              </button>
                              <button 
                                onClick={() => handleFeedback(g.id, false)}
                                className="flex-1 bg-white text-red-600 border border-red-200 font-black py-3 rounded-xl hover:bg-red-50 transition"
                              >
                                Not Fixed
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {g.status === GrievanceStatus.CLOSED && (
                    <div className="mt-6 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center space-y-3">
                      <div className="text-[10px] font-black text-emerald-700 tracking-widest uppercase">
                        Case Closed Permanently • Resident Satisfied
                      </div>
                      <div className="text-[10px] font-black text-emerald-600">
                        Resolved: {
                          (() => {
                            console.log('🔍 Debug (CLOSED) - Complaint data:', g);
                            console.log('🔍 Debug (CLOSED) - resolvedAt value:', g.resolvedAt);
                            console.log('🔍 Debug (CLOSED) - updatedAt value:', g.updatedAt);
                            
                            // Try resolvedAt first, then updatedAt as fallback
                            const timestamp = g.resolvedAt || g.updatedAt;
                            console.log('🔍 Debug (CLOSED) - using timestamp:', timestamp);
                            
                            if (timestamp) {
                              const date = new Date(timestamp);
                              console.log('🔍 Debug (CLOSED) - parsed date:', date);
                              console.log('🔍 Debug (CLOSED) - is valid date:', !isNaN(date.getTime()));
                              if (!isNaN(date.getTime())) {
                                return date.toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                });
                              }
                            }
                            return 'Processing...';
                          })()
                        }
                      </div>
                      {g.rating && (
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-bold text-emerald-600 uppercase mb-1">Your Rating</span>
                          <StarRating rating={g.rating} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
