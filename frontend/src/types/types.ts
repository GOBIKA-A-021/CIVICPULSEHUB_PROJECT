
export enum UserRole {
  CITIZEN = 'CITIZEN',
  OFFICER = 'OFFICER',
  ADMIN = 'ADMIN'
}

export enum GrievanceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  REOPENED = 'REOPENED',
  CLOSED = 'CLOSED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  departmentKey?: string;
  token?: string;
}

export interface Grievance {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  status: GrievanceStatus;
  location: string;
  citizenId: string;
  citizenName?: string;
  citizenEmail?: string;
  assignedOfficer?: string;
  assignedOfficerId?: string;
  officerLevel?: string;
  department?: string;
  issueImage?: string; // base64 mock
  proofImage?: string; // base64 mock
  resolutionRemarks?: string;
  feedbackMessage?: string;
  rating?: number;
  isSatisfied?: boolean;
  
  // AI Generated Fields
  aiCategory?: string;
  aiSummary?: string;
  aiPriority?: Priority;
  aiSentiment?: 'urgent' | 'frustrated' | 'neutral' | 'informational';
  aiRecommendation?: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
  clusterId?: string;
  
  // Deadline tracking
  deadlineDate?: string;
  resolvedDate?: string;
  closedDate?: string;
  assignedAt?: string;
  resolvedAt?: string;
  reopenedAt?: string;
  
  createdAt: string;
  updatedAt: string;
}
