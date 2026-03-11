import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'civic-pulse-secret-key';

export const signup = async (req, res) => {
  try {
    const { username, name, email, password, phone, role, departmentKey, department, designation, district, zone, employeeId } = req.body;
    
    if (!username || !name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      username, 
      name, 
      email, 
      password: hashedPassword, 
      phone,
      role, 
      departmentKey,
      department,
      designation,
      district,
      zone,
      employeeId
    });
    await user.save();
    res.status(201).json({ 
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      message: 'User created successfully'
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET);
    res.json({
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      departmentKey: user.departmentKey,
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
