import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import PDFDocument from 'pdfkit';
import { sendComplaintSubmittedEmail, sendComplaintResolvedEmail, sendComplaintAssignedEmail, sendOfficerAssignmentEmail } from '../services/emailService.js';
import aiService from '../services/aiService.js';

export const getComplaints = async (req, res) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'CITIZEN') {
      // Citizens can only see their own complaints
      query = { citizenId: req.user.id };
    } else if (req.user.role === 'OFFICER') {
      // Officers can only see complaints assigned to them
      // Convert req.user.id to a string for proper matching
      const officerId = req.user.id.toString();
      query = { 
        assignedOfficerId: officerId  // Only assigned to this specific officer
      };
      console.log(`👮 Officer ${req.user.id} fetching complaints. Query:`, query);
    }
    // Admins see all complaints (empty query)
    
    const complaints = await Complaint.find(query).sort({ createdAt: -1 });
    console.log(`📊 Found ${complaints.length} complaints for query:`, JSON.stringify(query));
    
    const mappedComplaints = complaints.map(c => {
      const obj = c.toObject();
      return {
        ...obj,
        id: c.id || c._id.toString(),
        createdAt: c.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: c.updatedAt?.toISOString() || new Date().toISOString(),
        resolvedAt: c.resolvedAt?.toISOString() || null
      };
    });
    
    if (req.user.role === 'OFFICER') {
      console.log(`📤 Returning ${mappedComplaints.length} complaints to officer ${req.user.id}`);
      mappedComplaints.forEach(c => {
        console.log(`   ✓ ${c.id}: ${c.title} (assigned: ${c.assignedOfficerId}, status: ${c.status})`);
      });
    }
    
    res.json(mappedComplaints);
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ error: err.message });
  }
};

export const createComplaint = async (req, res) => {
  try {
    const id = 'GRV-' + Math.floor(1000 + Math.random() * 9000);
    
    // Get citizen info for email
    const citizen = await User.findById(req.user.id);
    
    // Start with basic complaint data
    const complaintData = {
      ...req.body,
      id,
      citizenId: req.user.id,
      citizenName: citizen?.name,
      citizenEmail: citizen?.email,
      status: 'PENDING'
    };

    // Create complaint without AI fields first
    const complaint = new Complaint(complaintData);
    await complaint.save();

    // Process AI features asynchronously (non-blocking)
    processAIFeatures(complaint, citizen);

    // Send submission email
    if (citizen?.email) {
      try {
        await sendComplaintSubmittedEmail(
          citizen.email,
          citizen.name || 'Citizen',
          id,
          req.body.title
        );
        console.log(`✅ Submission email sent to ${citizen.email}`);
      } catch (emailErr) {
        console.error('Failed to send email notification:', emailErr);
      }
    }
    
    const obj = complaint.toObject();
    res.status(201).json({
      ...obj,
      id: complaint.id,
      createdAt: complaint.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: complaint.updatedAt?.toISOString() || new Date().toISOString()
    });
  } catch (err) {
    console.error('Error creating complaint:', err);
    res.status(400).json({ error: err.message });
  }
};

/**
 * Process AI features asynchronously
 * This runs in the background without blocking the API response
 */
const processAIFeatures = async (complaint, citizen) => {
  try {
    const updateData = {};

    // 1. AI Categorization
    if (!complaint.category || complaint.category === 'Other') {
      const category = await aiService.categorizeComplaint(complaint.description);
      updateData.category = category;
      console.log(`✅ AI Categorized: ${updateData.category}`);
    }

    // 2. AI Priority Detection
    // Always detect priority for comparison, but respect frontend AI if it already set a non-default priority
    const priorityResult = await aiService.detectPriority(complaint.description, complaint.category || updateData.category);
    updateData.aiPriority = priorityResult; // Save AI-detected priority for reference
    
    // Only override priority field if it wasn't already set by frontend or is still the default MEDIUM
    if (!complaint.priority || complaint.priority === 'MEDIUM') {
      updateData.priority = priorityResult; // Use AI detection for priority field
      console.log(`✅ AI Priority: ${updateData.priority}`);
    } else {
      // Priority was already set by frontend AI, keep it but log the AI suggestion for reference
      console.log(`✅ Frontend Priority Kept: ${complaint.priority} (AI suggested: ${priorityResult})`);
    }

    // 3. AI Summary
    const summary = await aiService.summarizeComplaint(complaint.description);
    updateData.aiSummary = summary;
    console.log(`✅ AI Summary: ${updateData.aiSummary}`);

    // 4. AI Sentiment Analysis
    const sentiment = await aiService.analyzeSentiment(complaint.description);
    updateData.aiSentiment = sentiment;
    console.log(`✅ AI Sentiment: ${updateData.aiSentiment}`);

    // 5. AI Recommendation
    const category = updateData.category || complaint.category;
    const recommendation = await aiService.getRecommendation(complaint.description, category);
    updateData.aiRecommendation = recommendation;
    console.log(`✅ AI Recommendation: ${updateData.aiRecommendation}`);

    // 6. Duplicate Detection
    const duplicate = await aiService.checkDuplicate(complaint.description, complaint.location, complaint.citizenId);
    if (duplicate) {
      updateData.isDuplicate = true;
      updateData.duplicateOf = duplicate.id;
      console.log(`⚠️ Duplicate Found: ${duplicate.id}`);
    }

    // 7. Smart Officer Assignment
    const category_final = updateData.category || complaint.category;
    console.log(`🔍 Assigning officer for category: ${category_final}`);
    
    const officer = await aiService.assignOfficer(category_final, complaint.location, User);
    if (officer) {
      updateData.assignedOfficerId = officer._id.toString();
      updateData.assignedOfficer = officer.name;
      updateData.department = officer.department;
      updateData.status = 'IN_PROGRESS'; // Change to IN_PROGRESS after AI assignment
      updateData.assignedAt = new Date().toISOString(); // Track assignment time
      
      console.log(`✅ Assigned to: ${officer.name} (${officer.department}) - Status updated to IN_PROGRESS`);
      
      // Update officer's pending complaints count
      await User.findByIdAndUpdate(officer._id, {
        $inc: { pendingComplaints: 1 }
      });

      // Send assignment email to officer
      try {
        await sendOfficerAssignmentEmail(officer.email, complaint.id, complaint.title);
        console.log(`📧 Assignment email sent to officer: ${officer.email}`);
      } catch (emailErr) {
        console.error('Failed to send assignment email:', emailErr);
      }

      // Send assignment notification to citizen
      if (citizen?.email) {
        try {
          await sendComplaintAssignedEmail(
            citizen.email,
            citizen.name || 'Citizen',
            complaint.id,
            complaint.title,
            officer.name,
            officer.department
          );
          console.log(`📧 Assignment notification sent to citizen: ${citizen.email}`);
        } catch (emailErr) {
          console.error('Failed to send citizen assignment email:', emailErr);
        }
      }
    } else {
      console.error(`❌ NO OFFICER FOUND for category: ${category_final}`);
      console.error('Possible causes:');
      console.error('1. No officers exist with matching departmentKey');
      console.error('2. All officers in that department are inactive (isActive: false)');
      console.error('3. Officers missing departmentKey field in database');
    }

    // Update complaint with all AI-generated fields
    if (Object.keys(updateData).length > 0) {
      console.log(`🔄 Updating complaint ${complaint.id} with:`, updateData);
      await Complaint.findByIdAndUpdate(complaint._id, updateData);
      
      // Verify the update was saved correctly
      const updatedComplaint = await Complaint.findById(complaint._id);
      console.log(`✅ Complaint ${complaint.id} updated. Current status: ${updatedComplaint.status}, Assigned to: ${updatedComplaint.assignedOfficer}`);
      console.log(`✅ AI features processed for complaint ${complaint.id}`);
    }
  } catch (error) {
    console.error(`❌ Error processing AI features for complaint ${complaint.id}:`, error);
    console.error('Error details:', error.message);
    // Don't fail the complaint creation if AI processing fails
  }
};

// Helper function to migrate existing resolved complaints
export const migrateResolvedAt = async () => {
  try {
    console.log('🔄 Starting migration for resolvedAt field...');
    
    // Find all RESOLVED or CLOSED complaints that don't have resolvedAt
    const complaintsToUpdate = await Complaint.find({
      $or: [
        { status: 'RESOLVED' },
        { status: 'CLOSED' }
      ],
      resolvedAt: { $exists: false }
    });
    
    console.log(`📊 Found ${complaintsToUpdate.length} complaints to update`);
    
    for (const complaint of complaintsToUpdate) {
      // Use updatedAt as the resolvedAt timestamp (when it was last updated)
      const resolvedAt = complaint.updatedAt || complaint.createdAt;
      await Complaint.findByIdAndUpdate(complaint._id, { 
        resolvedAt: resolvedAt 
      });
      console.log(`✅ Updated complaint ${complaint.id} with resolvedAt: ${resolvedAt}`);
    }
    
    console.log('🎉 Migration completed successfully');
    return { updated: complaintsToUpdate.length };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

export const updateComplaint = async (req, res) => {
  try {
    // Get the complaint BEFORE update to check current status
    const originalComplaint = await Complaint.findOne({ id: req.params.id });
    if (!originalComplaint) return res.status(404).json({ error: 'Complaint not found' });

    // Prepare update data with automatic timestamps
    const updateData = { ...req.body };
    
    // If officer is being assigned, set both assignedOfficer and assignedOfficerId
    if (req.body.assignedOfficer) {
      // Find the officer by name to get their ID
      const User = require('./User').default; // Import User model
      const officer = await User.findOne({ name: req.body.assignedOfficer, role: 'OFFICER' });
      if (officer) {
        updateData.assignedOfficerId = officer._id.toString();
        console.log(`👮 Setting assignedOfficerId: ${officer._id.toString()} for officer: ${req.body.assignedOfficer}`);
      } else {
        console.log(`⚠️ Officer not found: ${req.body.assignedOfficer}`);
      }
    }
    
    // Auto-set resolvedAt when status changes to RESOLVED or CLOSED
    if ((req.body.status === 'RESOLVED' || req.body.status === 'CLOSED') && 
        originalComplaint.status !== 'RESOLVED' && 
        originalComplaint.status !== 'CLOSED') {
      updateData.resolvedAt = new Date().toISOString();
      console.log(`📅 Setting resolvedAt for complaint ${req.params.id}: ${updateData.resolvedAt}`);
      console.log(`📅 Previous status: ${originalComplaint.status}, New status: ${req.body.status}`);
    } else {
      console.log(`📅 Not setting resolvedAt for complaint ${req.params.id}. Status: ${req.body.status}, Previous: ${originalComplaint.status}`);
      console.log(`📅 Current resolvedAt: ${originalComplaint.resolvedAt}`);
    }

    const complaint = await Complaint.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );
    
    // Send email notification if status changed to RESOLVED
    if (req.body.status === 'RESOLVED' && complaint.citizenEmail) {
      try {
        console.log(`📧 Sending resolution email to: ${complaint.citizenEmail} for complaint ${complaint.id}`);
        
        // Get citizen name for personalization
        const citizen = await User.findById(complaint.citizenId);
        const citizenName = citizen ? citizen.name : 'Citizen';
        
        await sendComplaintResolvedEmail(
          complaint.citizenEmail,
          citizenName,
          complaint.id,
          complaint.title,
          complaint.assignedOfficer || 'Assigned Officer',
          req.body.resolutionRemarks || 'Issue has been resolved successfully.'
        );
        console.log(`✅ Resolution email sent to ${complaint.citizenEmail}`);
      } catch (emailErr) {
        console.error('❌ Failed to send resolution email:', emailErr);
        // Don't fail the request if email fails
      }
    }
    
    // Send email to citizen if complaint is marked as CLOSED (final closure)
    if (req.body.status === 'CLOSED' && complaint.citizenEmail) {
      try {
        console.log(`📧 Sending closure email to: ${complaint.citizenEmail} for complaint ${complaint.id}`);
        // Note: sendComplaintClosedEmail is not implemented in our new service yet
        // await sendComplaintClosedEmail(
        //   complaint.citizenEmail,
        //   complaint.id,
        //   complaint.title
        // );
        console.log(`✅ Closure email would be sent to ${complaint.citizenEmail}`);
      } catch (emailErr) {
        console.error('❌ Failed to send closure email:', emailErr);
        // Don't fail the request if email fails
      }
    }
    
    const obj = complaint.toObject();
    console.log(`📅 Returning complaint ${complaint.id} with resolvedAt: ${complaint.resolvedAt}`);
    res.json({
      ...obj,
      id: complaint.id,
      createdAt: complaint.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: complaint.updatedAt?.toISOString() || new Date().toISOString(),
      resolvedAt: complaint.resolvedAt?.toISOString() || null
    });
  } catch (err) {
    console.error('Error updating complaint:', err);
    res.status(400).json({ error: err.message });
  }
};

export const getOfficers = async (req, res) => {
  try {
    // Only show officers who have complete profiles (real signups, not default seeded)
    const officers = await User.find({ 
      role: 'OFFICER',
      // Filter for officers with additional fields that indicate real signup
      $or: [
        { phone: { $exists: true, $ne: null, $ne: '' } },
        { employeeId: { $exists: true, $ne: null, $ne: '' } },
        { district: { $exists: true, $ne: null, $ne: '' } },
        { zone: { $exists: true, $ne: null, $ne: '' } }
      ]
    }).select('-password');
    
    console.log(`👮 Found ${officers.length} real officers with complete profiles`);
    
    const mappedOfficers = officers.map(o => ({
      id: o._id,
      username: o.username,
      name: o.name,
      email: o.email,
      role: o.role,
      department: o.department,
      departmentKey: o.departmentKey,
      designation: o.designation,
      phone: o.phone,
      employeeId: o.employeeId,
      district: o.district,
      zone: o.zone,
      pendingComplaintsCount: o.pendingComplaints || 0,
      completedCount: o.completedComplaints || 0
    }));
    
    console.log(`📊 Returning ${mappedOfficers.length} officers to admin`);
    mappedOfficers.forEach(o => {
      console.log(`   - ${o.name} (${o.email}) - ${o.department} - ${o.designation}`);
    });
    
    res.json(mappedOfficers);
  } catch (err) {
    console.error('❌ Error fetching officers:', err);
    res.status(500).json({ error: err.message });
  }
};

// Smart officer assignment based on category/department
export const suggestOfficer = async (req, res) => {
  try {
    const { category, priority } = req.body;

    // Updated Category to Department mapping - matching actual categories
    const categoryToDept = {
      'Road Maintenance': 'ROADS',
      'Potholes': 'ROADS',
      'Street Lighting': 'ELECTRICITY',
      'Street Light': 'ELECTRICITY',
      'Water Supply': 'WATER',
      'Water Pipe': 'WATER',
      'Drainage Issues': 'WATER',
      'Electricity': 'ELECTRICITY',
      'Power Outage': 'ELECTRICITY',
      'Waste Management': 'SANITATION',
      'Garbage': 'SANITATION',
      'Sanitation': 'SANITATION',
      'Public Safety': 'PUBLIC_SAFETY',
      'Infrastructure': 'ROADS',
      'Parks & Recreation': 'PARKS',
      'Parks': 'PARKS',
      'Public Health': 'HEALTH',
      'Health': 'HEALTH',
      'Traffic Management': 'PUBLIC_SAFETY',
      'Education': 'EDUCATION',
      'Community': 'EDUCATION'
    };

    const dept = categoryToDept[category] || 'GENERAL';

    // Find officers in matching department with least pending complaints
    const officers = await User.find({ 
      role: 'OFFICER', 
      departmentKey: dept  // Use departmentKey instead of department
    }).sort({ pendingComplaints: 1 });

    if (officers.length === 0) {
      // Fallback: Get officer with least pending complaints (any dept)
      const fallbackOfficers = await User.find({ role: 'OFFICER' }).sort({ pendingComplaints: 1 });
      return res.json({
        suggested: fallbackOfficers[0] || null,
        department: 'General',
        reason: 'No officers in matching department. Assigned to least busy officer.'
      });
    }

    res.json({
      suggested: officers[0],
      department: dept,
      reason: `${officers[0].name} is in the ${dept} department with ${officers[0].pendingComplaints || 0} pending complaints`
    });
  } catch (err) {
    console.error('Error suggesting officer:', err);
    res.status(500).json({ error: err.message });
  }
};

export const downloadComplaintPDF = async (req, res) => {
  try {
    if (!PDFDocument) {
      return res.status(400).json({ error: 'PDF generation not configured. Install pdfkit package.' });
    }

    const complaint = await Complaint.findOne({ id: req.params.id });
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Check authorization: only citizen who filed, assigned officer, or admin can download
    if (req.user.role === 'CITIZEN' && complaint.citizenId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Create PDF document
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="complaint-${complaint.id}.pdf"`);
    
    // Pipe to response
    doc.pipe(res);

    // Generate PDF content
    doc.fontSize(20).font('Helvetica-Bold').text('Complaint Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(12).font('Helvetica-Bold').text('Complaint ID: ' + complaint.id);
    doc.fontSize(11).font('Helvetica').text('Status: ' + complaint.status);
    doc.text('Priority: ' + complaint.priority);
    doc.moveDown(0.5);

    doc.fontSize(13).font('Helvetica-Bold').text('Title');
    doc.fontSize(11).font('Helvetica').text(complaint.title);
    doc.moveDown(0.3);

    doc.fontSize(12).font('Helvetica-Bold').text('Category: ');
    doc.fontSize(11).font('Helvetica').text(complaint.category);
    
    doc.fontSize(12).font('Helvetica-Bold').text('Location: ');
    doc.fontSize(11).font('Helvetica').text(complaint.location);
    doc.moveDown(0.5);

    doc.fontSize(12).font('Helvetica-Bold').text('Description');
    doc.fontSize(10).font('Helvetica').text(complaint.description, {
      align: 'left',
      width: 500,
      wrap: true
    });
    doc.moveDown(0.5);

    if (complaint.assignedOfficer) {
      doc.fontSize(12).font('Helvetica-Bold').text('Assigned Officer');
      doc.fontSize(11).font('Helvetica').text(complaint.assignedOfficer);
      if (complaint.officerLevel) doc.text('Level: ' + complaint.officerLevel);
      doc.moveDown(0.5);
    }

    if (complaint.resolutionRemarks) {
      doc.fontSize(12).font('Helvetica-Bold').text('Resolution Remarks');
      doc.fontSize(10).font('Helvetica').text(complaint.resolutionRemarks, {
        align: 'left',
        width: 500,
        wrap: true
      });
      doc.moveDown(0.5);
    }

    doc.fontSize(10).font('Helvetica');
    doc.text('Created: ' + new Date(complaint.createdAt).toLocaleString());
    if (complaint.updatedAt) {
      doc.text('Updated: ' + new Date(complaint.updatedAt).toLocaleString());
    }

    doc.moveDown(1);
    doc.fontSize(8).font('Helvetica').text('This is an official complaint report from CivicPulseHub', { align: 'center' });
    doc.text('Generated on ' + new Date().toLocaleString(), { align: 'center' });

    // End document
    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};
