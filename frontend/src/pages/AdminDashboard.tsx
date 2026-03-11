
import React, { useState, useEffect } from 'react';
import { User, Grievance, GrievanceStatus, Priority } from '../types/types';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line } from 'recharts';

const AdminDashboard: React.FC<{ user: User; initialView?: string }> = ({ user, initialView }) => {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [officers, setOfficers] = useState<User[]>([]);
  const [filterPriority, setFilterPriority] = useState<Priority | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<GrievanceStatus | 'ALL'>('ALL');
  const [activeView, setActiveView] = useState(initialView || 'OVERVIEW');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clusters, setClusters] = useState<any[]>([]);
  const [clusterLoading, setClusterLoading] = useState(false);
  const [sentimentCounts, setSentimentCounts] = useState<any>({});
  const [selectedComplaint, setSelectedComplaint] = useState<Grievance | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialView) setActiveView(initialView);
  }, [initialView]);

  useEffect(() => {
    // Load AI insights when viewing AI tab
    if (activeView === 'AI_INSIGHTS') {
      loadAIInsights();
    }
  }, [activeView]);

  const loadAIInsights = async () => {
    setClusterLoading(true);
    try {
      const result = await api.getComplaintClusters();
      setClusters(result.clusters || []);
    } catch (err) {
      console.error('Failed to load clusters:', err);
    } finally {
      setClusterLoading(false);
    }

    // Calculate sentiment counts
    const sentiment: any = {};
    grievances.forEach(g => {
      const sent = g.aiSentiment || 'unknown';
      sentiment[sent] = (sentiment[sent] || 0) + 1;
    });
    setSentimentCounts(sentiment);
  };

  const loadData = async () => {
    const [gList, oList] = await Promise.all([
      api.getGrievances(),
      api.getOfficers()
    ]);
    setGrievances(gList);
    setOfficers(oList);
  };

  const handleViewDetails = (complaint: Grievance) => {
    setSelectedComplaint(complaint);
    setShowDetails(true);
  };

  const handleAssign = async (id: string) => {
    if (!selectedOfficerId) {
      alert('Please select an officer.');
      return;
    }
    const officer = officers.find(o => o.id === selectedOfficerId);
    setIsAssigning(true);
    setError(null);
    try {
      await api.updateGrievance(id, { 
        status: GrievanceStatus.IN_PROGRESS,
        assignedOfficer: officer?.name || 'Unknown Officer',
        officerLevel: officer?.designation || officer?.department || 'Field Specialist',
        department: officer?.department || officer?.departmentKey || 'General',
        updatedAt: new Date().toISOString()
      });
      setAssigningId(null);
      setSelectedOfficerId('');
      
      // Update modal immediately if it's open for this complaint
      if (showDetails && selectedComplaint?.id === id) {
        console.log('🔄 Immediate modal update - Old officer:', selectedComplaint.assignedOfficer);
        console.log('🔄 Immediate modal update - New officer:', officer?.name);
        
        // Update the selected complaint with new officer info immediately
        setSelectedComplaint(prev => prev ? {
          ...prev,
          assignedOfficer: officer?.name || 'Unknown Officer',
          officerLevel: officer?.designation || officer?.department || 'Field Specialist',
          department: officer?.department || officer?.departmentKey || 'General',
          status: GrievanceStatus.IN_PROGRESS,
          updatedAt: new Date().toISOString()
        } : null);
      }
      
      // Then refresh data to ensure consistency
      await loadData();
      
      // Final check to make sure modal has the latest data
      if (showDetails && selectedComplaint?.id === id) {
        const updatedComplaint = grievances.find(g => g.id === id);
        if (updatedComplaint) {
          console.log('🔄 Final modal sync - Server data:', updatedComplaint.assignedOfficer);
          setSelectedComplaint(updatedComplaint);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign officer. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredGrievances = grievances.filter(g => {
    const pMatch = filterPriority === 'ALL' || g.priority === filterPriority;
    const sMatch = filterStatus === 'ALL' || g.status === filterStatus;
    return pMatch && sMatch;
  });

  // Chart Data
  const statusCounts = grievances.reduce((acc: any, g) => {
    acc[g.status] = (acc[g.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.keys(statusCounts).map(status => ({
    name: status.replace('_', ' '),
    value: statusCounts[status]
  }));

  const categoryCounts = grievances.reduce((acc: any, g) => {
    acc[g.category] = (acc[g.category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    value: categoryCounts[cat]
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EF4444'];

  // Officer Performance Data
  const officerWorkload = officers.map(officer => {
    const assignedCount = grievances.filter(g => g.assignedOfficer === officer.name).length;
    const resolvedCount = grievances.filter(g => g.assignedOfficer === officer.name && g.status === GrievanceStatus.RESOLVED).length;
    const closedCount = grievances.filter(g => g.assignedOfficer === officer.name && g.status === GrievanceStatus.CLOSED).length;
    return {
      name: officer.name,
      district: officer.district || 'N/A',
      assigned: assignedCount,
      resolved: resolvedCount,
      closed: closedCount
    };
  });

  const pendingCount = grievances.filter(g => g.status === GrievanceStatus.PENDING).length;
  const inProgressCount = grievances.filter(g => g.status === GrievanceStatus.IN_PROGRESS).length;
  const resolvedCount = grievances.filter(g => g.status === GrievanceStatus.RESOLVED).length;
  const closedCount = grievances.filter(g => g.status === GrievanceStatus.CLOSED).length;

  const renderOverview = () => (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">System Oversight</h1>
          <p className="text-slate-500 font-medium">Managing civic health across all sectors • {officers.length} Active Officers</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center min-w-[120px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Efficiency</span>
            <span className="text-2xl font-black text-emerald-600">
              {Math.round(((closedCount + resolvedCount) / (grievances.length || 1)) * 100)}%
            </span>
          </div>
          <div className="bg-white px-6 py-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center min-w-[120px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Reports</span>
            <span className="text-2xl font-black text-blue-600">{grievances.length}</span>
          </div>
        </div>
      </div>

      {/* 4-Card Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-100 flex flex-col justify-between">
          <div>
            <h4 className="text-blue-100 font-black uppercase text-[10px] tracking-widest mb-3">Total Pending</h4>
            <p className="text-5xl font-black">{pendingCount}</p>
          </div>
          <div className="w-full bg-blue-500/30 h-2 rounded-full mt-6 overflow-hidden">
            <div className="bg-blue-200 h-full rounded-full" style={{ width: `${(pendingCount / (grievances.length || 1)) * 100}%` }}></div>
          </div>
          <p className="text-[10px] text-blue-200 mt-2 font-bold">{Math.round((pendingCount / (grievances.length || 1)) * 100)}% of total</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 flex flex-col justify-between">
          <div>
            <h4 className="text-indigo-100 font-black uppercase text-[10px] tracking-widest mb-3">In Progress</h4>
            <p className="text-5xl font-black">{inProgressCount}</p>
          </div>
          <div className="w-full bg-indigo-500/30 h-2 rounded-full mt-6 overflow-hidden">
            <div className="bg-indigo-200 h-full rounded-full" style={{ width: `${(inProgressCount / (grievances.length || 1)) * 100}%` }}></div>
          </div>
          <p className="text-[10px] text-indigo-200 mt-2 font-bold">{Math.round((inProgressCount / (grievances.length || 1)) * 100)}% of total</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-8 text-white shadow-xl shadow-emerald-100 flex flex-col justify-between">
          <div>
            <h4 className="text-emerald-100 font-black uppercase text-[10px] tracking-widest mb-3">Resolved</h4>
            <p className="text-5xl font-black">{resolvedCount}</p>
          </div>
          <div className="w-full bg-emerald-500/30 h-2 rounded-full mt-6 overflow-hidden">
            <div className="bg-emerald-200 h-full rounded-full" style={{ width: `${(resolvedCount / (grievances.length || 1)) * 100}%` }}></div>
          </div>
          <p className="text-[10px] text-emerald-200 mt-2 font-bold">{Math.round((resolvedCount / (grievances.length || 1)) * 100)}% of total</p>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-3xl p-8 text-white shadow-xl shadow-red-100 flex flex-col justify-between">
          <div>
            <h4 className="text-red-100 font-black uppercase text-[10px] tracking-widest mb-3">Closed</h4>
            <p className="text-5xl font-black">{closedCount}</p>
          </div>
          <div className="w-full bg-red-500/30 h-2 rounded-full mt-6 overflow-hidden">
            <div className="bg-red-200 h-full rounded-full" style={{ width: `${(closedCount / (grievances.length || 1)) * 100}%` }}></div>
          </div>
          <p className="text-[10px] text-red-200 mt-2 font-bold">{Math.round((closedCount / (grievances.length || 1)) * 100)}% of total</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">Complaint Status</h3>
            <div className="flex flex-wrap gap-2">
              {statusData.map((d, i) => (
                <div key={d.name} className="flex items-center text-[8px] font-black uppercase tracking-tighter">
                  <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-500">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider mb-8">Category Breakdown</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 'bold' }} width={140} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#3B82F6" radius={[0, 12, 12, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider mb-6">Top Officers by Assignments</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {officerWorkload.sort((a, b) => b.assigned - a.assigned).slice(0, 6).map((officer, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-r from-slate-50 to-transparent rounded-2xl border border-slate-100 hover:border-blue-200 transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <span className="text-sm font-black text-slate-900">{officer.name}</span>
                    <span className="block text-[10px] text-slate-400">{officer.district}</span>
                  </div>
                  <span className="text-2xl font-black text-blue-600">{officer.assigned}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(officer.resolved / (officer.assigned || 1)) * 100}%` }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">{officer.resolved} resolved</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h4 className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-3">Citizen Satisfaction</h4>
          <p className="text-5xl font-black text-slate-900">
            {Math.round((grievances.filter(g => g.isSatisfied).length / (grievances.filter(g => g.status === GrievanceStatus.CLOSED).length || 1)) * 100)}%
          </p>
          <p className="text-xs text-slate-500 mt-4 font-medium">Based on closed case feedback.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h4 className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-3">Avg Officer Load</h4>
          <p className="text-5xl font-black text-slate-900">
            {(grievances.length / (officers.length || 1)).toFixed(1)}
          </p>
          <p className="text-xs text-slate-500 mt-4 font-medium">Complaints per officer across system.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h4 className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-3">Avg Rating</h4>
          <div className="flex items-baseline space-x-2">
            <p className="text-5xl font-black text-slate-900">
              {(grievances.filter(g => g.rating).reduce((acc, g) => acc + (g.rating || 0), 0) / (grievances.filter(g => g.rating).length || 1)).toFixed(1)}
            </p>
            <span className="text-yellow-400 text-2xl">★</span>
          </div>
          <p className="text-xs text-slate-500 mt-4 font-medium">From {grievances.filter(g => g.rating).length} reviews.</p>
        </div>
      </div>
    </div>
  );

  const renderAIInsights = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase mb-2">AI-Powered Insights</h1>
        <p className="text-slate-500 font-medium">Identify patterns and similar complaints with AI clustering</p>
      </div>

      {/* Sentiment Analysis Cards */}
      <div>
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">Sentiment Analysis Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {['urgent', 'frustrated', 'neutral', 'informational'].map((sentiment) => (
            <div key={sentiment} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h4 className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-3 capitalize">{sentiment}</h4>
              <p className="text-4xl font-black text-slate-900">{sentimentCounts[sentiment] || 0}</p>
              <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${((sentimentCounts[sentiment] || 0) / (grievances.length || 1)) * 100}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-bold">{Math.round(((sentimentCounts[sentiment] || 0) / (grievances.length || 1)) * 100)}% of complaints</p>
            </div>
          ))}
        </div>
      </div>

      {/* Complaint Clusters */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Complaint Clusters</h3>
            <p className="text-sm text-slate-500 mt-1">Similar complaints grouped by category and location</p>
          </div>
          <button
            onClick={loadAIInsights}
            disabled={clusterLoading}
            className={`bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition ${clusterLoading ? 'opacity-50' : ''}`}
          >
            {clusterLoading ? 'Loading...' : 'Refresh Clusters'}
          </button>
        </div>

        {clusterLoading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500 font-medium">Loading complaint clusters...</p>
          </div>
        ) : clusters.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500 font-medium">No clustered complaints found. New clusters will appear as similar complaints are reported.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {clusters.sort((a, b) => b.count - a.count).map((cluster, idx) => (
              <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{cluster.category}</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">{cluster.location}</p>
                    </div>
                    <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-xl text-sm font-bold">
                      {cluster.count} similar
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-2 max-h-48 overflow-y-auto">
                  {cluster.complaints.slice(0, 5).map((complaint: any, cidx: number) => (
                    <div key={cidx} className="text-[10px] text-slate-600 pb-2 border-b border-slate-50 last:border-0">
                      <span className="font-bold text-slate-700">{complaint.id}</span>: {complaint.title}
                    </div>
                  ))}
                  {cluster.complaints.length > 5 && (
                    <p className="text-[10px] text-slate-400 italic pt-2">+{cluster.complaints.length - 5} more complaints</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Critical Sentiment Alerts */}
      <div>
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">🚨 Critical Sentiment Alerts</h3>
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-3xl border border-red-200 p-8">
          {grievances.filter(g => g.aiSentiment === 'urgent' || g.aiSentiment === 'frustrated').length === 0 ? (
            <p className="text-slate-600 font-medium">No urgent or frustrated complaints at this time.</p>
          ) : (
            <div className="space-y-4">
              {grievances
                .filter(g => g.aiSentiment === 'urgent')
                .slice(0, 5)
                .map(g => (
                  <div key={g.id} className="bg-white p-4 rounded-2xl border border-red-100">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-black text-red-600 bg-red-100 px-2 py-1 rounded">URGENT</span>
                        <p className="font-bold text-slate-900 mt-2">{g.title}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold">{g.id}</span>
                    </div>
                    <p className="text-xs text-slate-600">{g.description.substring(0, 100)}...</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderManage = () => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom duration-500">
      <div className="p-8 border-b border-slate-100 flex flex-wrap gap-6 items-center justify-between">
        <h3 className="font-black text-slate-900 uppercase tracking-tight">System Management & Assignments</h3>
        <div className="flex gap-4">
          <select 
            className="text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 outline-none focus:ring-4 focus:ring-blue-50 transition"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
          >
            <option value="ALL">Priority (All)</option>
            <option value={Priority.HIGH}>High</option>
            <option value={Priority.MEDIUM}>Medium</option>
            <option value={Priority.LOW}>Low</option>
          </select>
          <select 
            className="text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 outline-none focus:ring-4 focus:ring-blue-50 transition"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="ALL">Status (All)</option>
            <option value={GrievanceStatus.PENDING}>Pending</option>
            <option value={GrievanceStatus.IN_PROGRESS}>In Progress</option>
            <option value={GrievanceStatus.REOPENED}>Reopened</option>
            <option value={GrievanceStatus.RESOLVED}>Resolved</option>
            <option value={GrievanceStatus.CLOSED}>Closed</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b">
            <tr>
              <th className="px-6 py-4">Complaint</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Assignment</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {filteredGrievances.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-300 italic">No records matching filters.</td></tr>
            ) : filteredGrievances.map(g => (
              <tr key={g.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-blue-600 block mb-0.5">{g.id}</span>
                  <span className="font-bold text-slate-800">{g.title}</span>
                  <span className="block text-[10px] text-slate-400 mt-1 uppercase">{g.category} • {g.location}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                    g.priority === Priority.HIGH ? 'border-red-200 text-red-600 bg-red-50' : 'border-slate-200 text-slate-500'
                  }`}>
                    {g.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase ${
                    g.status === GrievanceStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                    g.status === GrievanceStatus.REOPENED ? 'bg-red-600 text-white' :
                    g.status === GrievanceStatus.CLOSED ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {g.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {assigningId === g.id ? (
                    <div className="flex flex-col gap-2">
                       {error && <p className="text-[10px] text-red-600 font-bold">{error}</p>}
                       <select 
                         disabled={isAssigning}
                         className="text-[10px] font-bold border border-slate-200 rounded-lg p-2 outline-none"
                         value={selectedOfficerId}
                         onChange={(e) => setSelectedOfficerId(e.target.value)}
                       >
                         <option value="">Select Officer</option>
                         {officers.map(o => (
                           <option key={o.id} value={o.id}>{o.name} ({o.department})</option>
                         ))}
                       </select>
                       <div className="flex gap-2">
                         <button 
                           onClick={() => handleAssign(g.id)} 
                           disabled={isAssigning}
                           className={`bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold ${isAssigning ? 'opacity-50' : ''}`}
                         >
                           {isAssigning ? 'Assigning...' : 'Assign'}
                         </button>
                         <button 
                           onClick={() => { setAssigningId(null); setError(null); }} 
                           disabled={isAssigning}
                           className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-bold"
                         >
                           Cancel
                         </button>
                       </div>
                    </div>
                  ) : g.assignedOfficer ? (
                    <div className="text-xs">
                      <span className="font-bold text-slate-700">{g.assignedOfficer}</span>
                      <span className="block text-[9px] text-slate-400 italic">{g.officerLevel}</span>
                    </div>
                  ) : (
                    <span className="text-xs italic text-red-400">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col gap-2 items-end">
                    {/* View Details Button */}
                    <button 
                      onClick={() => handleViewDetails(g)}
                      className="bg-slate-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-700 shadow-sm"
                    >
                      View Details
                    </button>
                    
                    {/* Assign/Reassign Buttons */}
                    {!g.assignedOfficer && assigningId !== g.id && (
                      <button 
                        onClick={() => setAssigningId(g.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm"
                      >
                        Assign Officer
                      </button>
                    )}
                    
                    {g.assignedOfficer && assigningId !== g.id && (
                      <button 
                        onClick={() => setAssigningId(g.id)}
                        className="bg-orange-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-orange-700 shadow-sm"
                      >
                        Reassign
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Complaint Details Modal
  const renderComplaintDetails = () => {
    if (!showDetails || !selectedComplaint) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-8 border-b border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Complaint Details</h2>
                <p className="text-slate-500 mt-1">{selectedComplaint.id}</p>
              </div>
              <button 
                onClick={() => setShowDetails(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Title</p>
                    <p className="font-bold text-slate-900">{selectedComplaint.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Category</p>
                    <p className="font-bold text-slate-900">{selectedComplaint.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Location</p>
                    <p className="font-bold text-slate-900">{selectedComplaint.location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Priority</p>
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                      selectedComplaint.priority === Priority.HIGH ? 'bg-red-100 text-red-600' :
                      selectedComplaint.priority === Priority.MEDIUM ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {selectedComplaint.priority}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                      selectedComplaint.status === GrievanceStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                      selectedComplaint.status === GrievanceStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-600' :
                      selectedComplaint.status === GrievanceStatus.RESOLVED ? 'bg-emerald-100 text-emerald-600' :
                      selectedComplaint.status === GrievanceStatus.CLOSED ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {selectedComplaint.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Assignment Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Assigned Officer</p>
                    <p className="font-bold text-slate-900">{selectedComplaint.assignedOfficer || 'Not Assigned'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Department</p>
                    <p className="font-bold text-slate-900">{selectedComplaint.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Officer Level</p>
                    <p className="font-bold text-slate-900">{selectedComplaint.officerLevel || selectedComplaint.designation || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Submitted</p>
                    <p className="font-bold text-slate-900">{new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
                  </div>
                  {selectedComplaint.resolvedAt && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Resolved</p>
                      <p className="font-bold text-slate-900">{new Date(selectedComplaint.resolvedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Description</h3>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl">{selectedComplaint.description}</p>
            </div>

            {/* AI Insights */}
            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">AI Insights</h3>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-blue-600 uppercase tracking-wider">AI Category</p>
                    <p className="font-bold text-blue-900">{selectedComplaint.aiCategory || selectedComplaint.category || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 uppercase tracking-wider">AI Priority</p>
                    <p className="font-bold text-blue-900">{selectedComplaint.aiPriority || selectedComplaint.priority || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 uppercase tracking-wider">Sentiment</p>
                    <p className="font-bold text-blue-900">{selectedComplaint.aiSentiment || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 uppercase tracking-wider">AI Summary</p>
                    <p className="font-bold text-blue-900 text-sm">{selectedComplaint.aiSummary || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Images */}
            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Evidence</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedComplaint.issueImage && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Issue Image</p>
                    <img src={selectedComplaint.issueImage} className="w-full h-48 object-cover rounded-xl border border-slate-200" alt="Issue" />
                  </div>
                )}
                {selectedComplaint.proofImage && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Proof Image</p>
                    <img src={selectedComplaint.proofImage} className="w-full h-48 object-cover rounded-xl border border-slate-200" alt="Proof" />
                  </div>
                )}
                {!selectedComplaint.issueImage && !selectedComplaint.proofImage && (
                  <p className="text-slate-400 italic">No images available</p>
                )}
              </div>
            </div>

            {/* Resolution Details */}
            {selectedComplaint.status === GrievanceStatus.RESOLVED && (
              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Resolution Details</h3>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-xs text-emerald-600 uppercase tracking-wider mb-2">Resolution Remarks</p>
                  <p className="text-emerald-900">{selectedComplaint.resolutionRemarks || 'No remarks provided'}</p>
                </div>
              </div>
            )}

            {/* Feedback */}
            {selectedComplaint.isSatisfied !== undefined && (
              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Citizen Feedback</h3>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-600 uppercase tracking-wider mb-1">Satisfaction</p>
                      <p className="font-bold text-purple-900">{selectedComplaint.isSatisfied ? 'Satisfied' : 'Not Satisfied'}</p>
                    </div>
                    {selectedComplaint.rating && (
                      <div className="text-right">
                        <p className="text-xs text-purple-600 uppercase tracking-wider mb-1">Rating</p>
                        <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map(star => (
                            <svg key={star} className={`w-4 h-4 ${star <= (selectedComplaint.rating || 0) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedComplaint.feedbackMessage && (
                    <div className="mt-4">
                      <p className="text-xs text-purple-600 uppercase tracking-wider mb-2">Feedback Message</p>
                      <p className="text-purple-900 italic">"{selectedComplaint.feedbackMessage}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
      <div className="flex justify-center mb-10">
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
          <button 
            onClick={() => setActiveView('OVERVIEW')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'OVERVIEW' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveView('MANAGE')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'MANAGE' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Manage System
          </button>
          <button 
            onClick={() => setActiveView('AI_INSIGHTS')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'AI_INSIGHTS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            🤖 AI Insights
          </button>
        </div>
      </div>

      {activeView === 'OVERVIEW' ? renderOverview() : activeView === 'MANAGE' ? renderManage() : renderAIInsights()}
      {renderComplaintDetails()}
    </div>
  );
};

export default AdminDashboard;
