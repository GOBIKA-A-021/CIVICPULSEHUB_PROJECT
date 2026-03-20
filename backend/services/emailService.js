import nodemailer from 'nodemailer';

// Check if email is properly configured
const isEmailConfigured = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  if (!emailUser || !emailPass || 
      emailUser === 'your_email@gmail.com' || 
      emailPass === 'your_app-password') {
    return false;
  }
  return true;
};

// Email configuration
const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'civicpulsehub@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
};

// Create email transporter
const createTransporter = () => {
  if (!isEmailConfigured()) {
    console.log('⚠️ Email service not configured - using placeholder credentials');
  }
  return nodemailer.createTransporter(emailConfig);
};

// Email templates
const emailTemplates = {
  complaintSubmitted: (citizenName, complaintId, title) => ({
    subject: `Complaint Submitted - ${complaintId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">CivicPulseHub</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Voice Matters</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-top: 0;">Complaint Received Successfully! 📝</h2>
          <p>Dear <strong>${citizenName}</strong>,</p>
          <p>Thank you for reaching out! Your complaint has been successfully submitted and is now being processed.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #667eea;">Complaint Details:</h3>
            <p><strong>ID:</strong> ${complaintId}</p>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Status:</strong> <span style="color: #f39c12; font-weight: bold;">PENDING</span></p>
          </div>
          
          <h3>What happens next?</h3>
          <ul style="line-height: 1.6;">
            <li>Your complaint will be reviewed by our team</li>
            <li>It will be assigned to the appropriate department</li>
            <li>You'll receive updates on the progress</li>
          </ul>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:5173/citizen-dashboard" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              Track Your Complaint
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; 2024 CivicPulseHub. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  complaintAssigned: (citizenName, complaintId, title, officerName, department) => ({
    subject: `Complaint Assigned - ${complaintId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">CivicPulseHub</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Voice Matters</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-top: 0;">Complaint Assigned! 👮‍♂️</h2>
          <p>Dear <strong>${citizenName}</strong>,</p>
          <p>Great news! Your complaint has been assigned to a qualified officer who will work on resolving it.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60;">
            <h3 style="margin-top: 0; color: #27ae60;">Assignment Details:</h3>
            <p><strong>ID:</strong> ${complaintId}</p>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Assigned Officer:</strong> ${officerName}</p>
            <p><strong>Department:</strong> ${department}</p>
            <p><strong>Status:</strong> <span style="color: #27ae60; font-weight: bold;">IN_PROGRESS</span></p>
          </div>
          
          <h3>What happens next?</h3>
          <ul style="line-height: 1.6;">
            <li>The assigned officer will investigate your complaint</li>
            <li>They will take appropriate action to resolve the issue</li>
            <li>You'll be notified once the issue is resolved</li>
          </ul>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:5173/citizen-dashboard" style="background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              Track Progress
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; 2024 CivicPulseHub. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  complaintResolved: (citizenName, complaintId, title, officerName, resolutionRemarks) => ({
    subject: `Complaint Resolved - ${complaintId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">CivicPulseHub</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Voice Matters</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-top: 0;">Complaint Resolved! ✅</h2>
          <p>Dear <strong>${citizenName}</strong>,</p>
          <p>Excellent news! Your complaint has been successfully resolved by our team.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60;">
            <h3 style="margin-top: 0; color: #27ae60;">Resolution Details:</h3>
            <p><strong>ID:</strong> ${complaintId}</p>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Resolved By:</strong> ${officerName}</p>
            <p><strong>Status:</strong> <span style="color: #27ae60; font-weight: bold;">RESOLVED</span></p>
            <p><strong>Resolution Remarks:</strong> ${resolutionRemarks}</p>
          </div>
          
          <h3>What's next?</h3>
          <ul style="line-height: 1.6;">
            <li>Please review the resolution provided</li>
            <li>Visit your dashboard to provide feedback</li>
            <li>Rate your satisfaction with the resolution</li>
          </ul>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:5173/citizen-dashboard" style="background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              Provide Feedback
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; 2024 CivicPulseHub. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  passwordReset: (userName, userEmail, resetLink, resetToken) => ({
    subject: 'Password Reset Request - CivicPulseHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">CivicPulseHub</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Voice Matters</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-top: 0;">Password Reset Request 🔐</h2>
          <p>Dear <strong>${userName}</strong>,</p>
          <p>We received a request to reset your password for your CivicPulseHub account. Click the button below to set a new password.</p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #856404;">Security Notice:</h3>
            <ul style="line-height: 1.6; color: #856404;">
              <li>This link is valid for <strong>1 hour only</strong></li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #e74c3c; color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e74c3c;">
            <h4 style="margin-top: 0; color: #e74c3c;">Alternative Method:</h4>
            <p>If the button doesn't work, copy and paste this link in your browser:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
              ${resetLink}
            </p>
          </div>
          
          <h3>Need Help?</h3>
          <p>If you're having trouble resetting your password, please contact our support team.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; 2024 CivicPulseHub. All rights reserved.</p>
        </div>
      </div>
    `
  })
};

// Send email function
export const sendEmail = async (to, template, templateData) => {
  // Check if email is configured
  if (!isEmailConfigured()) {
    console.log('❌ Email service not configured - cannot send email');
    return { 
      success: false, 
      error: 'Email service not configured. Please set up EMAIL_USER and EMAIL_PASS in your .env file.' 
    };
  }

  try {
    const transporter = createTransporter();
    const emailContent = template(...templateData);
    
    const mailOptions = {
      from: `"CivicPulseHub" <${emailConfig.auth.user}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    let errorMessage = 'Failed to send email';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check your Gmail credentials and app password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Failed to connect to email server. Please check your internet connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
};

// Specific email functions
export const sendComplaintSubmittedEmail = async (citizenEmail, citizenName, complaintId, title) => {
  return await sendEmail(citizenEmail, emailTemplates.complaintSubmitted, [citizenName, complaintId, title]);
};

export const sendComplaintAssignedEmail = async (citizenEmail, citizenName, complaintId, title, officerName, department) => {
  return await sendEmail(citizenEmail, emailTemplates.complaintAssigned, [citizenName, complaintId, title, officerName, department]);
};

export const sendComplaintResolvedEmail = async (citizenEmail, citizenName, complaintId, title, officerName, resolutionRemarks) => {
  return await sendEmail(citizenEmail, emailTemplates.complaintResolved, [citizenName, complaintId, title, officerName, resolutionRemarks]);
};

export const sendPasswordResetEmail = async (userEmail, userName, resetLink, resetToken) => {
  return await sendEmail(userEmail, emailTemplates.passwordReset, [userName, userEmail, resetLink, resetToken]);
};

export const sendOfficerAssignmentEmail = async (officerEmail, complaintId, title) => {
  const officerTemplate = {
    subject: `New Complaint Assigned - ${complaintId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">CivicPulseHub</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Officer Portal</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-top: 0;">New Complaint Assigned! 📋</h2>
          <p>Dear Officer,</p>
          <p>A new complaint has been assigned to you for resolution. Please review and take appropriate action.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db;">
            <h3 style="margin-top: 0; color: #3498db;">Complaint Details:</h3>
            <p><strong>ID:</strong> ${complaintId}</p>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Status:</strong> <span style="color: #f39c12; font-weight: bold;">IN_PROGRESS</span></p>
          </div>
          
          <h3>Action Required:</h3>
          <ul style="line-height: 1.6;">
            <li>Review complaint details thoroughly</li>
            <li>Investigate the reported issue</li>
            <li>Take appropriate action to resolve</li>
            <li>Update resolution status when complete</li>
          </ul>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:5173/officer-dashboard" style="background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              View Complaint
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; 2024 CivicPulseHub. All rights reserved.</p>
        </div>
      </div>
    `
  };
  
  return await sendEmail(officerEmail, officerTemplate, []);
};

export default {
  sendEmail,
  sendComplaintSubmittedEmail,
  sendComplaintAssignedEmail,
  sendComplaintResolvedEmail,
  sendPasswordResetEmail,
  sendOfficerAssignmentEmail
};
