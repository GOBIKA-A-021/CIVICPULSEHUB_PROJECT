import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['CITIZEN', 'OFFICER', 'ADMIN'], default: 'CITIZEN' },
  
  // Officer specific fields
  phone: String,
  departmentKey: String, // e.g., 'ROADS', 'WATER', 'ELECTRICITY'
  department: String, // Human-readable department name
  designation: String,
  district: String,
  zone: String,
  employeeId: String,
  
  // Officer performance metrics
  completedComplaints: { type: Number, default: 0 },
  pendingComplaints: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
