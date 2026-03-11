import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'CLOSED'], default: 'PENDING' },
  location: { type: String, required: true },
  citizenId: { type: String, required: true },
  citizenName: String,
  citizenEmail: String,
  assignedOfficer: String,
  assignedOfficerId: String,
  officerLevel: String,
  department: String,
  issueImage: String,
  proofImage: String,
  resolutionRemarks: String,
  feedbackMessage: String,
  rating: Number,
  isSatisfied: Boolean,
  
  // AI Generated Fields
  aiCategory: String,
  aiSummary: String,
  aiPriority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
  aiSentiment: { type: String, enum: ['urgent', 'frustrated', 'neutral', 'informational'] },
  aiRecommendation: String,
  isDuplicate: { type: Boolean, default: false },
  duplicateOf: String, // References another complaint ID if this is a duplicate
  clusterId: String, // For complaint clustering feature
  
  // Deadline tracking
  deadlineDate: Date,
  resolvedDate: Date,
  closedDate: Date,
  
  // Timeline tracking
  assignedAt: Date,
  resolvedAt: Date,
  reopenedAt: Date,
}, { timestamps: true });

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
