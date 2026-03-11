// Email utility using Gmail SMTP
// Note: Requires 'nodemailer' package. Install with: npm install nodemailer
// Gmail Setup:
// 1. Enable 2-Factor Authentication on your Gmail account
// 2. Create an App Password: https://myaccount.google.com/apppasswords
// 3. Set these environment variables:
//    - EMAIL_SERVICE_USER=your-email@gmail.com
//    - EMAIL_SERVICE_PASSWORD=your-app-password

let nodemailer = null;
let transporter = null;

// Initialize nodemailer
const initializeEmailService = async () => {
  try {
    nodemailer = await import('nodemailer');
    
    if (!process.env.EMAIL_SERVICE_USER || !process.env.EMAIL_SERVICE_PASSWORD) {
      console.warn('Email service not configured. Set EMAIL_SERVICE_USER and EMAIL_SERVICE_PASSWORD env variables.');
      return;
    }

    transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_SERVICE_USER,
        pass: process.env.EMAIL_SERVICE_PASSWORD
      }
    });

    console.log('Email service initialized successfully');
  } catch (err) {
    console.warn('Nodemailer not installed or email service failed to initialize. Install with: npm install nodemailer');
  }
};

// Initialize on import
initializeEmailService();

export const sendEmail = async (to, subject, htmlContent) => {
  if (!transporter) {
    console.warn('Email service not available. Logging email instead:');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${htmlContent}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_SERVICE_USER,
      to: to,
      subject: subject,
      html: htmlContent
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

export const sendComplaintSubmittedEmail = async (citizenEmail, complaintId, title) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="margin: 0; font-size: 24px;">✓ Complaint Registered</h2>
      </div>
      <div style="padding: 20px; background-color: #F9FAFB;">
        <p>Dear Valued Citizen,</p>
        <p>Thank you for reporting this civic issue. Your complaint has been successfully registered in the CivicPulseHub system.</p>
        
        <div style="background-color: #DBEAFE; padding: 15px; border-left: 4px solid #3B82F6; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>📋 Complaint ID:</strong> <code style="background: white; padding: 4px 8px; border-radius: 3px;">${complaintId}</code></p>
          <p style="margin: 5px 0;"><strong>📝 Title:</strong> ${title}</p>
          <p style="margin: 5px 0;"><strong>⏳ Status:</strong> <span style="background: #FCD34D; padding: 2px 6px; border-radius: 3px; font-weight: bold;">PENDING</span></p>
        </div>
        
        <p>Our officers have been notified and will begin working on resolving your complaint. You will receive updates via email as the status changes.</p>
        
        <h3 style="color: #1F2937; margin-top: 20px;">📌 What Happens Next?</h3>
        <ol style="color: #4B5563; line-height: 1.8;">
          <li>Your complaint will be reviewed by our administrative team</li>
          <li>An officer will be assigned to handle your case</li>
          <li>You will be notified when work begins (Status: IN PROGRESS)</li>
          <li>You will receive a resolution update with photos and details</li>
          <li>Finally, you will be asked to rate the resolution</li>
        </ol>
        
        <p style="color: #666; margin-top: 20px;">You can track your complaint status anytime by logging into your CivicPulseHub account using your email and password.</p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; margin-top: 20px; text-align: center;">
          This is an automated email from CivicPulseHub. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;
  
  return sendEmail(citizenEmail, `✓ Your Complaint Has Been Registered - ${complaintId}`, htmlContent);
};

export const sendComplaintResolvedEmail = async (citizenEmail, complaintId, title, remarks) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="margin: 0; font-size: 24px;">✅ Your Complaint Has Been Resolved</h2>
      </div>
      <div style="padding: 20px; background-color: #F9FAFB;">
        <p>Dear Valued Citizen,</p>
        <p>We are pleased to inform you that your complaint has been successfully resolved by our dedicated team.</p>
        
        <div style="background-color: #ECFDF5; padding: 15px; border-left: 4px solid #10B981; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>📋 Complaint ID:</strong> <code style="background: white; padding: 4px 8px; border-radius: 3px;">${complaintId}</code></p>
          <p style="margin: 5px 0;"><strong>📝 Title:</strong> ${title}</p>
          <p style="margin: 5px 0;"><strong>✓ Status:</strong> <span style="background: #10B981; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;">RESOLVED</span></p>
        </div>
        
        <h3 style="color: #1F2937;">Officer's Remarks:</h3>
        <div style="background-color: #F3F4F6; padding: 12px; border-radius: 6px; border-left: 3px solid #10B981; font-style: italic;">
          "${remarks || 'The reported issue has been carefully addressed and resolved according to service standards.'}"
        </div>
        
        <h3 style="color: #1F2937; margin-top: 20px;">📋 Your Feedback & Rating</h3>
        <p>Please log in to your CivicPulseHub account to:</p>
        <ul style="color: #4B5563; line-height: 1.8;">
          <li>View photo evidence of the resolution</li>
          <li>Rate the quality of work (1-5 stars)</li>
          <li>Provide feedback about your experience</li>
          <li>Decide if the issue is fully resolved or needs reopening</li>
        </ul>
        
        <p style="background: #FEF3C7; padding: 12px; border-radius: 6px; margin: 20px 0; color: #92400E;">
          ⏰ <strong>Action Required:</strong> Please provide your feedback within 7 days to help us improve our services.
        </p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated email from CivicPulseHub. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;
  
  return sendEmail(citizenEmail, `✅ Your Complaint Resolved - ${complaintId}`, htmlContent);
};

export const sendComplaintAssignmentEmail = async (officerEmail, complaintId, title, category) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6;">New Complaint Assigned to You</h2>
      <p>Dear Officer,</p>
      <p>A new complaint has been assigned to you for resolution.</p>
      
      <div style="background-color: #EFF6FF; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
        <p><strong>Complaint ID:</strong> ${complaintId}</p>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Category:</strong> ${category}</p>
      </div>
      
      <p>Please log in to your dashboard to view the full details and take action on this complaint.</p>
      
      <a href="https://civicpulsehub.example.com/dashboard" style="display: inline-block; background-color: #3B82F6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin: 20px 0;">View Complaint Details</a>
      
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        This is an automated email from CivicPulseHub. Please do not reply to this email.
      </p>
    </div>
  `;
  
  return sendEmail(officerEmail, `New Assignment - ${complaintId}`, htmlContent);
};

export const sendComplaintClosedEmail = async (citizenEmail, complaintId, title) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="margin: 0; font-size: 24px;">🔒 Complaint Case Closed</h2>
      </div>
      <div style="padding: 20px; background-color: #F9FAFB;">
        <p>Dear Valued Citizen,</p>
        <p>Your complaint case has been officially closed in our system. Thank you for your patience and cooperation throughout the resolution process.</p>
        
        <div style="background-color: #F3E8FF; padding: 15px; border-left: 4px solid #8B5CF6; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>📋 Complaint ID:</strong> <code style="background: white; padding: 4px 8px; border-radius: 3px;">${complaintId}</code></p>
          <p style="margin: 5px 0;"><strong>📝 Title:</strong> ${title}</p>
          <p style="margin: 5px 0;"><strong>🔒 Final Status:</strong> <span style="background: #8B5CF6; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;">CLOSED</span></p>
        </div>
        
        <h3 style="color: #1F2937;">We Appreciate Your Feedback!</h3>
        <p>Your rating and comments help us improve our civic services. We value your input and will use it to enhance our processes for future complaints.</p>
        
        <h3 style="color: #1F2937; margin-top: 20px;">📞 Need Help?</h3>
        <p>If you have any new issues or concerns, you can always file a new complaint in the CivicPulseHub system. We're here to serve you!</p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated email from CivicPulseHub. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;
  
  return sendEmail(citizenEmail, `🔒 Case Closed - ${complaintId}`, htmlContent);
};
