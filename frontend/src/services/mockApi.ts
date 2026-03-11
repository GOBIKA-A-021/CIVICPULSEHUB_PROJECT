
import { User, UserRole, Grievance, GrievanceStatus, Priority } from '../types';

const USERS_KEY = 'civic_pulse_users';
const GRIEVANCES_KEY = 'civic_pulse_grievances';
const AUTH_KEY = 'civic_pulse_auth';

const initialUsers: User[] = [
  { id: '1', username: 'admin_central', name: 'Central Admin', email: 'admin@city.gov', role: UserRole.ADMIN, department: 'Administration' },
  { id: '2', username: 'officer_smith', name: 'Officer Smith', email: 'smith@police.gov', role: UserRole.OFFICER, department: 'Public Safety' },
  { id: '3', username: 'citizen_jane', name: 'Jane Doe', email: 'jane@gmail.com', role: UserRole.CITIZEN },
  { id: '4', username: 'officer_water', name: 'Officer Water', email: 'water@dept.gov', role: UserRole.OFFICER, department: 'Water Supply' },
  { id: '5', username: 'officer_roads', name: 'Officer Roads', email: 'roads@dept.gov', role: UserRole.OFFICER, department: 'Road Maintenance' },
  { id: '6', username: 'officer_sanitation', name: 'Officer Sanitation', email: 'sanitation@dept.gov', role: UserRole.OFFICER, department: 'Sanitation' }
];

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

export const initStorage = () => {
  if (!localStorage.getItem(USERS_KEY)) localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
  if (!localStorage.getItem(GRIEVANCES_KEY)) localStorage.setItem(GRIEVANCES_KEY, JSON.stringify([]));
};

export const api = {
  // Auth
  login: async (email: string): Promise<User> => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: any) => u.email === email);
    if (!user) throw new Error('User not found');
    const userWithToken = { ...user, token: 'mock-jwt-token-' + Math.random() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(userWithToken));
    return userWithToken;
  },

  signup: async (userData: Partial<User>): Promise<User> => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const newUser = { ...userData, id: Math.random().toString(36).substr(2, 9) } as User;
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return newUser;
  },

  getAuth: (): User | null => {
    const auth = localStorage.getItem(AUTH_KEY);
    return auth ? JSON.parse(auth) : null;
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },

  getOfficers: async (): Promise<User[]> => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return users.filter((u: User) => u.role === UserRole.OFFICER);
  },

  // Grievances
  getGrievances: async (): Promise<Grievance[]> => {
    return JSON.parse(localStorage.getItem(GRIEVANCES_KEY) || '[]');
  },

  submitGrievance: async (data: Partial<Grievance>): Promise<Grievance> => {
    const grievances = JSON.parse(localStorage.getItem(GRIEVANCES_KEY) || '[]');
    const newGrievance: Grievance = {
      ...data,
      id: 'GRV-' + Math.floor(1000 + Math.random() * 9000),
      status: GrievanceStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Grievance;
    
    grievances.push(newGrievance);
    localStorage.setItem(GRIEVANCES_KEY, JSON.stringify(grievances));
    return newGrievance;
  },

  updateGrievance: async (id: string, updates: Partial<Grievance>): Promise<Grievance> => {
    const grievances = JSON.parse(localStorage.getItem(GRIEVANCES_KEY) || '[]');
    const index = grievances.findIndex((g: any) => g.id === id);
    if (index === -1) throw new Error('Grievance not found');
    
    grievances[index] = { ...grievances[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(GRIEVANCES_KEY, JSON.stringify(grievances));
    return grievances[index];
  },

  assignOfficer: async (id: string, priority: Priority): Promise<Grievance> => {
    let officerLevel = 'Junior Officer';
    if (priority === Priority.HIGH) officerLevel = 'Senior Officer';
    else if (priority === Priority.MEDIUM) officerLevel = 'Regular Officer';

    return api.updateGrievance(id, { 
      assignedOfficer: `Auto-Assigned ${officerLevel}`,
      officerLevel: officerLevel,
      status: GrievanceStatus.IN_PROGRESS 
    });
  },

  // Process image upload (mock)
  uploadImage: async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
};
