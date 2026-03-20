import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'civic-pulse-secret-key';

export const signup = async (req, res) => {
  try {
    const { username, name, email, password, phone, role, departmentKey, department, designation, district, zone, employeeId } = req.body;
    
    if (!username || !name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Role validation: Reject Admin signup attempts
    if (role === 'ADMIN') {
      console.log(`🚫 Admin signup attempt rejected for email: ${email}`);
      return res.status(403).json({ 
        error: 'Admin registration is not allowed through public signup. Please contact system administrator.',
        code: 'ADMIN_SIGNUP_RESTRICTED'
      });
    }

    // Allow only CITIZEN and OFFICER roles
    const allowedRoles = ['CITIZEN', 'OFFICER'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Only CITIZEN and OFFICER roles are allowed for signup.',
        code: 'INVALID_ROLE'
      });
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
    
    console.log(`✅ New user registered: ${role} - ${email}`);
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
    console.log(`🔐 Login attempt for email: ${email}`);
    
    const user = await User.findOne({ email });
    console.log(`👤 User found: ${!!user}`);
    
    if (user) {
      console.log(`👤 User details:`, {
        username: user.username,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      });
    }
    
    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`🔑 Password valid: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      console.log(`❌ Invalid password for user: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      console.log(`❌ User account is inactive: ${email}`);
      return res.status(401).json({ error: 'Account is inactive' });
    }
    
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log(`✅ Login successful for: ${user.username} (${user.role})`);
    
    res.json({
      token,
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      departmentKey: user.departmentKey,
      designation: user.designation
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Forgot Password - Generate reset token and send email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`🔍 Password reset requested for non-existent email: ${email}`);
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        type: 'password-reset'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create reset link
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}&email=${email}`;
    
    // Send reset email
    try {
      const emailResult = await sendPasswordResetEmail(user.email, user.name, resetLink, resetToken);
      
      if (!emailResult.success) {
        console.error('❌ Failed to send password reset email:', emailResult.error);
        
        // Provide specific error message based on the failure
        let errorMessage = 'Failed to send reset email. Please try again.';
        if (emailResult.error.includes('not configured')) {
          errorMessage = 'Email service is not configured. Please contact the system administrator to set up email notifications.';
        } else if (emailResult.error.includes('authentication')) {
          errorMessage = 'Email authentication failed. Please contact the system administrator.';
        }
        
        return res.status(500).json({ error: errorMessage });
      }
      
      console.log(`📧 Password reset email sent to: ${email}`);
      res.json({ message: 'Password reset link has been sent to your email.' });
    } catch (emailErr) {
      console.error('❌ Failed to send password reset email:', emailErr);
      res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
    }
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Alternative forgot password methods (without email)
export const forgotPasswordAlternative = async (req, res) => {
  try {
    const { email, method } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`🔍 Password reset requested for non-existent email: ${email}`);
      // Don't reveal if email exists or not for security
      return res.json({ 
        message: 'If an account with this email exists, you can proceed with security questions.',
        method: 'security_questions',
        securityQuestion: 'What was your first pet\'s name?' // Default question for demo
      });
    }

    if (!user.securityQuestion || !user.securityAnswer) {
      return res.status(400).json({ 
        error: 'Security questions not set up for this account. Please contact administrator.',
        requiresSetup: true
      });
    }

    // Return security question for user to answer
    return res.json({
      message: 'Please answer your security question to reset password',
      method: 'security_questions',
      securityQuestion: user.securityQuestion,
      email: user.email,
      hint: `Hint: Default answers for testing - pet: 'default', admin: 'admin', city: 'city'`
    });

  } catch (err) {
    console.error('❌ Forgot password alternative error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Reset password using security questions
export const resetPasswordBySecurity = async (req, res) => {
  try {
    const { email, securityAnswer, newPassword } = req.body;
    
    if (!email || !securityAnswer || !newPassword) {
      return res.status(400).json({ error: 'Email, security answer, and new password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Check security answer (case-insensitive)
    if (user.securityAnswer.toLowerCase() !== securityAnswer.toLowerCase()) {
      return res.status(400).json({ error: 'Incorrect security answer' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await User.findByIdAndUpdate(user._id, { 
      password: hashedPassword,
      updatedAt: new Date()
    });

    console.log(`✅ Password reset successful via security questions for: ${email}`);
    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('❌ Reset password by security error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Setup security questions for user
export const setupSecurityQuestions = async (req, res) => {
  try {
    const { email, securityQuestion, securityAnswer } = req.body;
    
    if (!email || !securityQuestion || !securityAnswer) {
      return res.status(400).json({ error: 'Email, security question, and answer are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Update security questions
    await User.findByIdAndUpdate(user._id, {
      securityQuestion,
      securityAnswer
    });

    console.log(`✅ Security questions set up for: ${email}`);
    res.json({ message: 'Security questions set up successfully.' });
  } catch (err) {
    console.error('❌ Setup security questions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Reset Password - Verify token and update password
export const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    
    if (!token || !email || !newPassword) {
      return res.status(400).json({ error: 'Token, email, and new password are required' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if token is valid and matches email
    if (decoded.type !== 'password-reset' || decoded.email !== email) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await User.findByIdAndUpdate(user._id, { 
      password: hashedPassword,
      updatedAt: new Date()
    });

    console.log(`✅ Password reset successful for: ${email}`);
    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Reset token has expired. Please request a new password reset.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(400).json({ error: 'Invalid reset token.' });
    }
    console.error('❌ Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
