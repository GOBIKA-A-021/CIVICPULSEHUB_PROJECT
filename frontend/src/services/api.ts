import { User, Grievance, Priority } from '../types';

const API_BASE = '/api';

const getHeaders = () => {
  const auth = localStorage.getItem('civic_pulse_auth');
  const token = auth ? JSON.parse(auth).token : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const CATEGORIES = [
  'Infrastructure', 
  'Sanitation', 
  'Electricity', 
  'Water Supply', 
  'Public Safety', 
  'Road Maintenance', 
  'Waste Management', 
  'Street Lighting', 
  'Drainage Issues', 
  'Public Health',
  'Traffic Management',
  'Parks & Recreation'
];

export const api = {
  // Auth
  login: async (email: string, password?: string): Promise<User> => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    const user = await response.json();
    localStorage.setItem('civic_pulse_auth', JSON.stringify(user));
    return user;
  },

  signup: async (userData: any): Promise<User> => {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }
    return response.json();
  },

  getAuth: (): User | null => {
    const auth = localStorage.getItem('civic_pulse_auth');
    return auth ? JSON.parse(auth) : null;
  },

  logout: () => {
    localStorage.removeItem('civic_pulse_auth');
  },

  getOfficers: async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE}/grievances/officers`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch officers');
    return response.json();
  },

  // Get AI-suggested officer for a complaint
  suggestOfficer: async (category: string, priority: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/grievances/suggest-officer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ category, priority })
    });
    if (!response.ok) throw new Error('Failed to get officer suggestion');
    return response.json();
  },

  // Grievances
  getGrievances: async (): Promise<Grievance[]> => {
    const response = await fetch(`${API_BASE}/grievances`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch grievances');
    return response.json();
  },

  submitGrievance: async (data: Partial<Grievance>): Promise<Grievance> => {
    const response = await fetch(`${API_BASE}/grievances`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit grievance');
    }
    return response.json();
  },

  updateGrievance: async (id: string, updates: Partial<Grievance>): Promise<Grievance> => {
    const response = await fetch(`${API_BASE}/grievances/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update grievance');
    return response.json();
  },

  // Process image upload (mock)
  uploadImage: async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  },

  // Download complaint as PDF
  downloadComplaintPDF: async (id: string): Promise<void> => {
    try {
      const auth = localStorage.getItem('civic_pulse_auth');
      const token = auth ? JSON.parse(auth).token : null;
      
      const response = await fetch(`${API_BASE}/grievances/${id}/pdf`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `complaint-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to download PDF');
    }
  },

  // AI Features - Call backend AI endpoints
  // 1. AI Complaint Categorization
  categorizeComplaint: async (description: string): Promise<string> => {
    const response = await fetch(`${API_BASE}/ai/categorize`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ description })
    });
    if (!response.ok) throw new Error('Failed to categorize complaint');
    const data = await response.json();
    return data.category;
  },

  // 2. AI Priority Detection
  detectPriority: async (description: string, category: string): Promise<'LOW' | 'MEDIUM' | 'HIGH'> => {
    const response = await fetch(`${API_BASE}/ai/priority`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ description, category })
    });
    if (!response.ok) throw new Error('Failed to detect priority');
    const data = await response.json();
    return data.priority;
  },

  // 3. AI Complaint Summary
  summarizeComplaint: async (description: string): Promise<string> => {
    const response = await fetch(`${API_BASE}/ai/summarize`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ description })
    });
    if (!response.ok) throw new Error('Failed to summarize complaint');
    const data = await response.json();
    return data.summary;
  },

  // 4. AI Duplicate Detection
  checkDuplicate: async (description: string, location: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/ai/check-duplicate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ description, location })
    });
    if (!response.ok) throw new Error('Failed to check for duplicates');
    return response.json();
  },

  // 5. AI Officer Assignment
  assignOfficerAI: async (category: string, location: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/ai/assign-officer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ category, location })
    });
    if (!response.ok) throw new Error('Failed to assign officer');
    return response.json();
  },

  // 6. AI Sentiment Analysis
  analyzeSentiment: async (description: string): Promise<string> => {
    const response = await fetch(`${API_BASE}/ai/sentiment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ description })
    });
    if (!response.ok) throw new Error('Failed to analyze sentiment');
    const data = await response.json();
    return data.sentiment;
  },

  // 7. AI Complaint Clustering
  getComplaintClusters: async (): Promise<any> => {
    const response = await fetch(`${API_BASE}/ai/clusters`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to get complaint clusters');
    return response.json();
  },

  // 8. AI Recommendation System
  getRecommendation: async (description: string, category: string): Promise<string> => {
    const response = await fetch(`${API_BASE}/ai/recommendation`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ description, category })
    });
    if (!response.ok) throw new Error('Failed to get recommendation');
    const data = await response.json();
    return data.recommendation;
  }
};
