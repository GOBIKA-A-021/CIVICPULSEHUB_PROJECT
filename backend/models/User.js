import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['CITIZEN', 'OFFICER', 'ADMIN'], default: 'CITIZEN' },
  
  // Security questions for password reset
  securityQuestion: { type: String, enum: [
    'What was your first pet\'s name?',
    'What is your mother\'s maiden name?',
    'What city were you born in?',
    'What is your favorite childhood teacher\'s name?',
    'What is the name of your best childhood friend?',
    'What was your childhood nickname?',
    'What is the make and model of your first car?',
    'What is the name of the street you grew up on?'
  ]},
  securityAnswer: { type: String },
  
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
