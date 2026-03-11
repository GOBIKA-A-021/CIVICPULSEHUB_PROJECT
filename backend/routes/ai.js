import express from 'express';
import aiService from '../services/aiService.js';
import authenticate from '../middleware/authMiddleware.js';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * 1. POST /api/ai/categorize
 * AI Complaint Categorization
 * Analyzes complaint description and assigns it to a predefined category
 */
router.post('/categorize', authenticate, async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters' });
    }

    const category = await aiService.categorizeComplaint(description);
    
    res.json({ category });
  } catch (error) {
    console.error('Categorization API Error:', error);
    res.status(500).json({ error: 'Failed to categorize complaint: ' + error.message });
  }
});

/**
 * 2. POST /api/ai/priority
 * AI Complaint Priority Detection
 * Determines priority level based on complaint description
 */
router.post('/priority', authenticate, async (req, res) => {
  try {
    const { description, category } = req.body;
    
    if (!description || !category) {
      return res.status(400).json({ error: 'description and category are required' });
    }

    const priority = await aiService.detectPriority(description, category);
    
    res.json({ priority });
  } catch (error) {
    console.error('Priority Detection API Error:', error);
    res.status(500).json({ error: 'Failed to detect priority: ' + error.message });
  }
});

/**
 * 3. POST /api/ai/summarize
 * AI Complaint Summary
 * Generates a one-sentence summary of the complaint
 */
router.post('/summarize', authenticate, async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description || description.trim().length < 20) {
      return res.status(400).json({ error: 'Description must be at least 20 characters' });
    }

    const summary = await aiService.summarizeComplaint(description);
    
    res.json({ summary });
  } catch (error) {
    console.error('Summarization API Error:', error);
    res.status(500).json({ error: 'Failed to summarize complaint: ' + error.message });
  }
});

/**
 * 4. POST /api/ai/check-duplicate
 * AI Duplicate Complaint Detection
 * Checks if a similar complaint already exists
 */
router.post('/check-duplicate', authenticate, async (req, res) => {
  try {
    const { description, location } = req.body;
    
    if (!description || !location) {
      return res.status(400).json({ error: 'description and location are required' });
    }

    const duplicate = await aiService.checkDuplicate(description, location, req.user.id);
    
    if (duplicate) {
      return res.json({
        isDuplicate: true,
        existingComplaintId: duplicate.id,
        existingComplaintTitle: duplicate.title,
        message: `A similar complaint (${duplicate.id}) has already been reported in this location.`
      });
    }

    res.json({ isDuplicate: false });
  } catch (error) {
    console.error('Duplicate Detection API Error:', error);
    res.status(500).json({ error: 'Failed to check duplicate: ' + error.message });
  }
});

/**
 * 5. POST /api/ai/assign-officer
 * AI Smart Officer Assignment
 * Automatically assigns complaint to the best officer
 */
router.post('/assign-officer', authenticate, async (req, res) => {
  try {
    const { category, location } = req.body;
    
    if (!category || !location) {
      return res.status(400).json({ error: 'category and location are required' });
    }

    const officer = await aiService.assignOfficer(category, location, User);
    
    if (!officer) {
      return res.status(404).json({ error: 'No available officer found' });
    }

    res.json({
      officerId: officer._id,
      officerName: officer.name,
      officerEmail: officer.email,
      department: officer.department
    });
  } catch (error) {
    console.error('Officer Assignment API Error:', error);
    res.status(500).json({ error: 'Failed to assign officer: ' + error.message });
  }
});

/**
 * 6. POST /api/ai/sentiment
 * AI Sentiment Analysis
 * Analyzes the emotional tone of a complaint
 */
router.post('/sentiment', authenticate, async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters' });
    }

    const sentiment = await aiService.analyzeSentiment(description);
    
    res.json({ sentiment });
  } catch (error) {
    console.error('Sentiment Analysis API Error:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment: ' + error.message });
  }
});

/**
 * 7. GET /api/ai/clusters
 * AI Complaint Clustering
 * Groups similar complaints together by category and location
 */
router.get('/clusters', authenticate, async (req, res) => {
  try {
    // Only admins can view clusters
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can view complaint clusters' });
    }

    const clusters = await aiService.getClusteredComplaints(Complaint);
    
    res.json({ clusters });
  } catch (error) {
    console.error('Clustering API Error:', error);
    res.status(500).json({ error: 'Failed to get complaint clusters: ' + error.message });
  }
});

/**
 * 8. POST /api/ai/recommendation
 * AI Complaint Recommendation
 * Suggests possible solutions for complaints
 */
router.post('/recommendation', authenticate, async (req, res) => {
  try {
    const { description, category } = req.body;
    
    if (!description || !category) {
      return res.status(400).json({ error: 'description and category are required' });
    }

    const recommendation = await aiService.getRecommendation(description, category);
    
    res.json({ recommendation });
  } catch (error) {
    console.error('Recommendation API Error:', error);
    res.status(500).json({ error: 'Failed to get recommendation: ' + error.message });
  }
});

/**
 * POST /api/ai/complete-insights
 * Get all AI insights for a complaint (helper endpoint)
 */
router.post('/complete-insights', authenticate, async (req, res) => {
  try {
    const { description, category, location } = req.body;
    
    if (!description || !category || !location) {
      return res.status(400).json({ error: 'description, category, and location are required' });
    }

    const insights = await aiService.getCompleteInsights(description, category, location, User, Complaint);
    
    res.json(insights);
  } catch (error) {
    console.error('Complete Insights API Error:', error);
    res.status(500).json({ error: 'Failed to get complete insights: ' + error.message });
  }
});

/**
 * GET /api/ai/debug/database-state
 * Debug endpoint - Shows officers and complaint assignments
 * Only accessible to admins
 */
router.get('/debug/database-state', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can view debug data' });
    }

    const officers = await User.find({ role: 'OFFICER' }).select('_id name email department departmentKey isActive pendingComplaints');
    const complaints = await Complaint.find({}).select('id title category assignedOfficerId assignedOfficer status');

    res.json({
      timestamp: new Date().toISOString(),
      officers: {
        count: officers.length,
        data: officers.map(o => ({
          _id: o._id.toString(),
          name: o.name,
          email: o.email,
          department: o.department,
          departmentKey: o.departmentKey,
          isActive: o.isActive,
          pendingComplaints: o.pendingComplaints || 0
        }))
      },
      complaints: {
        count: complaints.length,
        data: complaints.map(c => ({
          id: c.id,
          title: c.title,
          category: c.category,
          assignedOfficerId: c.assignedOfficerId,
          assignedOfficer: c.assignedOfficer,
          status: c.status
        }))
      }
    });
  } catch (error) {
    console.error('Debug Database State Error:', error);
    res.status(500).json({ error: 'Failed to get database state: ' + error.message });
  }
});

export default router;
