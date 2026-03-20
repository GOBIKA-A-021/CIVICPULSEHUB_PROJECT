import fetch from 'node-fetch';
import Complaint from '../models/Complaint.js';
import { departmentsConfig, categoryDepartmentMap } from '../config/departments.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Default categories that match the frontend
const COMPLAINT_CATEGORIES = [
  'Infrastructure',
  'Sanitation',
  'Electricity',
  'Water Supply',
  'Public Safety',
  'Road Maintenance',
  'Waste Management',
  'Street Lighting',
  'Drainage Issues',
  'Public Health',
  'Traffic Management',
  'Parks & Recreation'
];

const PRIORITY_KEYS = {
  'ROADS': 'Road Maintenance',
  'WATER': 'Water Supply',
  'ELECTRICITY': 'Electricity',
  'SANITATION': 'Sanitation',
  'SAFETY': 'Public Safety'
};

/**
 * Call Google Gemini API
 */
const callGemini = async (prompt, temperature = 0.5) => {
  if (!GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY not configured, using fallback logic');
    return null; // Return null to trigger fallback
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: 100,
          topP: 0.8,
          topK: 10
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text?.trim() || '';
  } catch (error) {
    console.error('Gemini Call Error:', error);
    return null; // Return null to trigger fallback
  }
};

export const aiService = {
  /**
   * 1. AI Complaint Categorization
   * Analyzes complaint description and assigns it to a predefined category
   */
  async categorizeComplaint(description) {
    try {
      // Try Gemini first
      const prompt = `You are a complaint categorization assistant. Analyze the complaint description and classify it into EXACTLY ONE of these categories: ${COMPLAINT_CATEGORIES.join(', ')}.
      
KEY RULES:
1. Road-related issues (potholes, cracked pavement, road damage, uneven surfaces) → "Road Maintenance"
2. Street lighting issues (broken/dim lights, no lighting at night) → "Street Lighting"
3. Crimes, theft, harassment, violence, public disturbance → "Public Safety"
4. Water supply issues (no water, low pressure, contamination) → "Water Supply"
5. Drainage/flooding issues (blocked drains, stagnant water, flooding) → "Drainage Issues"
6. Garbage/litter accumulation → "Waste Management"
7. Sanitation issues (dirty areas, unhygienic conditions) → "Sanitation"
8. Electricity/power outages → "Electricity"
9. Issues with parks, playgrounds, green spaces → "Parks & Recreation"
10. Traffic control, parking, road signals → "Traffic Management"
11. Infrastructure failures (bridges, buildings) → "Infrastructure"
12. Public health concerns (disease, epidemic) → "Public Health"

Complaint: "${description}"

Respond with ONLY the exact category name from the list, nothing else.`;

      const response = await callGemini(prompt, 0.1);

      if (response) {
        let category = response;
        
        // Validate category
        const matched = COMPLAINT_CATEGORIES.find(cat => 
          cat.toLowerCase() === category.toLowerCase() || 
          cat.toLowerCase().includes(category.toLowerCase())
        );
        
        return matched || this.fallbackCategorization(description);
      }
      
      // Fallback to rule-based categorization
      return this.fallbackCategorization(description);
    } catch (error) {
      console.error('Categorization Error:', error);
      return this.fallbackCategorization(description);
    }
  },

  // Fallback rule-based categorization
  fallbackCategorization(description) {
    const desc = description.toLowerCase();
    
    // Street lighting keywords (check FIRST - more specific)
    if (desc.includes('street light') || desc.includes('streetlight') || desc.includes('lamp') || 
        desc.includes('illumination') || desc.includes('dark') || 
        (desc.includes('light') && desc.includes('street'))) {
      return 'Street Lighting';
    }
    
    // Electricity-related keywords (check before general 'electric')
    if (desc.includes('power') || desc.includes('outage') || 
        desc.includes('current') || desc.includes('wire') ||
        (desc.includes('electric') && !desc.includes('street'))) {
      return 'Electricity';
    }
    
    // Road-related keywords (check after street lighting)
    if (desc.includes('road') || desc.includes('pothole') || desc.includes('pavement') || 
        desc.includes('crack') || (desc.includes('street') && !desc.includes('light')) || 
        desc.includes('highway')) {
      return 'Road Maintenance';
    }
    
    // Water-related keywords
    if (desc.includes('water') || desc.includes('pipe') || desc.includes('leak') || 
        desc.includes('supply') || desc.includes('contamination')) {
      return 'Water Supply';
    }
    
    // Sanitation-related keywords
    if (desc.includes('garbage') || desc.includes('waste') || desc.includes('trash') || 
        desc.includes('cleanliness') || desc.includes('dump')) {
      return 'Waste Management';
    }
    
    // Drainage keywords
    if (desc.includes('drain') || desc.includes('flood') || desc.includes('water logging') || 
        desc.includes('stagnant') || desc.includes('overflow')) {
      return 'Drainage Issues';
    }
    
    // Public safety keywords
    if (desc.includes('crime') || desc.includes('theft') || desc.includes('safety') || 
        desc.includes('harassment') || desc.includes('violence') || desc.includes('security')) {
      return 'Public Safety';
    }
    
    // Parks and recreation keywords
    if (desc.includes('park') || desc.includes('garden') || desc.includes('playground') || 
        desc.includes('recreation') || desc.includes('trees')) {
      return 'Parks & Recreation';
    }
    
    // Traffic keywords
    if (desc.includes('traffic') || desc.includes('parking') || desc.includes('signal') || 
        desc.includes('jam') || desc.includes('vehicle')) {
      return 'Traffic Management';
    }
    
    // Infrastructure keywords
    if (desc.includes('building') || desc.includes('bridge') || desc.includes('structure') || 
        desc.includes('infrastructure') || desc.includes('construction')) {
      return 'Infrastructure';
    }
    
    // Public health keywords
    if (desc.includes('health') || desc.includes('disease') || desc.includes('epidemic') || 
        desc.includes('hygiene') || desc.includes('medical')) {
      return 'Public Health';
    }
    
    // Default fallback
    return 'Public Safety';
  },

  /**
   * 2. AI Complaint Priority Detection
   * Determines priority level based on complaint description
   */
  async detectPriority(description, category) {
    try {
      // Try Gemini first with improved prompt
      const prompt = `You are a complaint priority assessment assistant. Based on the complaint category and description, assess the urgency.

Category: ${category}
Description: "${description}"

RULES:
- HIGH: Affects public safety, infrastructure damage, health risks, emergency situations, large-scale impact, hazardous conditions
- MEDIUM: Important but not urgent, affects services, moderate inconvenience, quality of life issues
- LOW: Minor issues, no immediate risk, routine maintenance, aesthetic problems

Examples:
HIGH priority:
- "Water leaking from electric pole" (safety hazard)
- "Electrical hazards in school area" (public safety)
- "Overflowing sewage" (health risk)
- "Major road damage causing accidents" (infrastructure danger)
- "Burst water pipe flooding street" (emergency)

MEDIUM priority:
- "Street light not working" (safety concern but not immediate danger)
- "Water pressure low" (service quality issue)
- "Potholes causing vehicle damage" (moderate inconvenience)
- "Garbage not collected for 3 days" (health concern but not emergency)

LOW priority:
- "Park grass needs cutting" (aesthetic)
- "Minor road cracks" (routine maintenance)
- "One street light flickering" (minor issue)
- "Noise complaint during day" (quality of life)

Respond with ONLY one word: HIGH, MEDIUM, or LOW`;

      const response = await callGemini(prompt, 0.1);

      if (response) {
        const priority = response.toUpperCase().trim();
        console.log(`🎯 AI Priority Detection: "${description.substring(0, 50)}..." → ${priority}`);
        return (priority === 'HIGH' || priority === 'LOW') ? priority : 'MEDIUM';
      }
      
      // Fallback to rule-based priority detection
      console.log('🔄 AI Priority failed, using fallback logic');
      return this.fallbackPriorityDetection(description, category);
    } catch (error) {
      console.error('Priority Detection Error:', error);
      return this.fallbackPriorityDetection(description, category);
    }
  },

  // Fallback rule-based priority detection
  fallbackPriorityDetection(description, category) {
    const desc = description.toLowerCase();
    
    // HIGH priority keywords - more comprehensive
    const highKeywords = [
      'emergency', 'danger', 'hazard', 'safety', 'accident', 'fire', 'electric shock',
      'flooding', 'overflow', 'burst', 'collapse', 'broken', 'blocked', 'urgent',
      'critical', 'severe', 'major', 'life threatening', 'injury', 'health risk',
      'no water', 'no electricity', 'power outage', 'sewage', 'contamination',
      'falling', 'electrocution', 'explosion', 'toxic', 'gas leak', 'structural'
    ];
    
    // Check for high priority keywords
    const hasHighKeyword = highKeywords.some(keyword => desc.includes(keyword));
    if (hasHighKeyword) {
      console.log(`🔴 High Priority (Keyword): ${description.substring(0, 50)}...`);
      return 'HIGH';
    }
    
    // Category-based priority with better mapping
    const highPriorityCategories = ['Public Safety', 'Electricity', 'Public Health', 'Emergency'];
    const mediumPriorityCategories = ['Water Supply', 'Drainage Issues', 'Road Maintenance', 'Street Lighting'];
    const lowPriorityCategories = ['Parks & Recreation', 'Education', 'Community'];
    
    if (highPriorityCategories.includes(category)) {
      console.log(`🔴 High Priority (Category): ${category}`);
      return 'HIGH';
    } else if (mediumPriorityCategories.includes(category)) {
      console.log(`🟡 Medium Priority (Category): ${category}`);
      return 'MEDIUM';
    } else if (lowPriorityCategories.includes(category)) {
      console.log(`🟢 Low Priority (Category): ${category}`);
      return 'LOW';
    }
    
    // Context-based priority detection - enhanced
    if (desc.includes('no') || desc.includes('broken') || desc.includes('leaking') || desc.includes('blocked') ||
        desc.includes('danger') || desc.includes('hazard') || desc.includes('accident') ||
        desc.includes('falling') || desc.includes('collapsed') || desc.includes('burst')) {
      console.log(`🔴 High Priority (Context): ${description.substring(0, 50)}...`);
      return 'HIGH';
    }
    
    if (desc.includes('poor') || desc.includes('bad') || desc.includes('slow') || desc.includes('intermittent') ||
        desc.includes('weak') || desc.includes('low pressure') || desc.includes('flickering')) {
      console.log(`🟡 Medium Priority (Context): ${description.substring(0, 50)}...`);
      return 'MEDIUM';
    }
    
    // Default to LOW for minor issues
    console.log(`🟢 Low Priority (Default): ${description.substring(0, 50)}...`);
    return 'LOW';
  },

  /**
   * 3. AI Complaint Summary
   * Generates a one-sentence summary of the complaint
   */
  async summarizeComplaint(description) {
    try {
      const prompt = `You are a complaint summarization assistant. Summarize the given complaint in ONE concise sentence (max 15 words). Respond with ONLY the summary, no punctuation at end.

Complaint: "${description}"

Summary:`;

      const response = await callGemini(prompt, 0.5);
      return response || description.substring(0, 100);
    } catch (error) {
      console.error('Summarization Error:', error);
      return description.substring(0, 100);
    }
  },

  /**
   * 4. AI Duplicate Complaint Detection
   * Checks if a similar complaint already exists
   */
  async checkDuplicate(description, location, citizenId) {
    try {
      // Get recent complaints from the same location
      const recentComplaints = await Complaint.find({
        location: location,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }).limit(10);

      if (recentComplaints.length === 0) {
        return null;
      }

      // Check for similarity using AI
      const complaintsList = recentComplaints
        .map(c => `ID: ${c.id}, Category: ${c.category}, Description: ${c.description.substring(0, 100)}`)
        .join('\n\n');

      const prompt = `You are a duplicate complaint detector. Compare the new complaint with existing complaints and identify if there's a similar one.
        
Return format: If a duplicate is found, respond with ONLY the complaint ID (e.g., "GRV-1234"). If no duplicate, respond with "NONE".

New Complaint:
Location: ${location}
Description: ${description}

Existing Complaints from the same location:
${complaintsList}

Is this a duplicate? If yes, return the complaint ID. If no, return NONE.`;

      const response = await callGemini(prompt, 0.2);

      const result = response.trim();
      if (result === 'NONE' || !result.startsWith('GRV-')) {
        return null;
      }

      // Verify the returned ID exists in our complaints
      const duplicate = recentComplaints.find(c => c.id === result);
      return duplicate ? { id: duplicate.id, title: duplicate.title } : null;
    } catch (error) {
      console.error('Duplicate Detection Error:', error);
      return null;
    }
  },

  /**
   * 5. AI Smart Officer Assignment
   * Automatically assigns complaint to the best officer based on category and workload
   */
  async assignOfficer(category, location, User) {
    try {
      // Step 1: Map complaint category to department key using the centralized config
      // Enhanced mapping to handle all complaint categories
      const categoryToDeptKey = {
        // Basic Infrastructure & Roads
        'Infrastructure': 'ROADS',
        'Road Maintenance': 'ROADS',
        'Potholes': 'ROADS',
        'Road Damage': 'ROADS',
        
        // Water Related
        'Water Supply': 'WATER',
        'Water Pipe': 'WATER',
        'Drainage Issues': 'WATER',
        
        // Electricity
        'Electricity': 'ELECTRICITY',
        'Power Outage': 'ELECTRICITY',
        'Street Lighting': 'ELECTRICITY',
        'Street Light': 'ELECTRICITY',
        
        // Sanitation & Waste
        'Sanitation': 'SANITATION',
        'Waste Management': 'SANITATION',
        'Garbage': 'SANITATION',
        
        // Public Safety
        'Public Safety': 'PUBLIC_SAFETY',
        'Traffic Management': 'PUBLIC_SAFETY',
        
        // Health
        'Public Health': 'HEALTH',
        'Health': 'HEALTH',
        
        // Parks & Recreation
        'Parks & Recreation': 'PARKS',
        'Parks': 'PARKS'
      };

      // Get the department key for this category
      const departmentKey = categoryToDeptKey[category] || categoryDepartmentMap[category] || 'PUBLIC_SAFETY';
      const departmentName = departmentsConfig[departmentKey]?.name;

      console.log(`Assigning officer for category: "${category}" → Department Key: "${departmentKey}" → Name: "${departmentName}"`);

      if (!departmentName) {
        console.warn(`Department not found for key "${departmentKey}", using PUBLIC_SAFETY as fallback`);
      }

      // Step 2: Find available officers in the relevant department and district
      // First try exact district match, then department match
      let officers = [];
      
      // Try to find officers in the same district first
      if (location) {
        // Extract district from location (simple text matching)
        const locationLower = location.toLowerCase();
        console.log(`🔍 Searching for officers in location: "${location}"`);
        
        officers = await User.find({
          role: 'OFFICER',
          departmentKey: departmentKey,
          district: { $regex: locationLower, $options: 'i' }, // Case-insensitive district match
          isActive: true,
          departmentKey: { $exists: true, $ne: null }
        }).select('_id name email department departmentKey pendingComplaints district');
        
        console.log(`Found ${officers.length} officers in department "${departmentKey}" and matching district "${location}"`);
      }
      
      // If no district match, fallback to department-only search
      if (officers.length === 0) {
        console.log(`⚠️ No officers found in district, searching by department only...`);
        officers = await User.find({
          role: 'OFFICER',
          departmentKey: departmentKey,
          isActive: true,
          departmentKey: { $exists: true, $ne: null }
        }).select('_id name email department departmentKey pendingComplaints district');
        
        console.log(`Found ${officers.length} officers in department "${departmentKey}" (district ignored)`);
      }

      // Validate that officers have required fields
      const validOfficers = officers.filter(o => 
        o._id && o.name && o.email && o.departmentKey
      );
      
      if (validOfficers.length === 0 && officers.length > 0) {
        console.error(`⚠️ ${officers.length} officers found but missing required fields (name, email, departmentKey)`);
      }

      // Step 3: If no valid officers in the specific department, expand search slightly
      let assignedOfficer = null;
      if (validOfficers.length === 0) {
        console.warn(`No valid officers found in "${departmentKey}" department, trying by department name...`);
        // Try finding by department name as fallback
        const officersByName = await User.find({
          role: 'OFFICER',
          department: departmentName,
          isActive: true,
          departmentKey: { $exists: true, $ne: null }  // Still require departmentKey
        }).select('_id name email department departmentKey pendingComplaints');
        
        const validOfficersByName = officersByName.filter(o => 
          o._id && o.name && o.email && o.departmentKey
        );
        
        if (validOfficersByName.length > 0) {
          console.log(`Found ${validOfficersByName.length} valid officers by department name`);
          assignedOfficer = validOfficersByName.reduce((prev, current) => {
            return (current.pendingComplaints || 0) < (prev.pendingComplaints || 0) ? current : prev;
          });
        }
      } else {
        // Step 4: Sort officers by workload (pending complaints) and pick the least busy
        assignedOfficer = validOfficers.reduce((prev, current) => {
          const prevLoad = current.pendingComplaints || 0;
          const currLoad = (prev.pendingComplaints || 0);
          console.log(`Comparing officer loads: ${prev.name} (${currLoad}) vs ${current.name} (${prevLoad})`);
          return currLoad < prevLoad ? prev : current;
        });
      }

      if (assignedOfficer) {
        console.log(`✅ Assigned officer: ${assignedOfficer.name} from ${assignedOfficer.department} (Pending: ${assignedOfficer.pendingComplaints || 0})`);
        return assignedOfficer;
      }

      console.warn(`No officers found for category "${category}". This should not happen if departments are properly configured.`);
      return null;
    } catch (error) {
      console.error('Officer Assignment Error:', error);
      return null;
    }
  },

  /**
   * 6. AI Sentiment Analysis
   * Analyzes the emotional tone of a complaint
   */
  async analyzeSentiment(description) {
    try {
      const prompt = `Analyze the tone/sentiment of the complaint document. Respond with ONLY one label: 
- "urgent" for emergency/crisis situations
- "frustrated" for angry, disappointed people
- "neutral" for factual, matter-of-fact descriptions
- "informational" for neutral reports

Examples:
- "WATER LEAKING EVERYWHERE, FIX THIS NOW!!!!" → urgent
- "I'm sick of this broken street, total neglect" → frustrated
- "There is a pothole on Main Street near the market" → neutral
- "Reporting a street light that is not working" → informational

Complaint: "${description}"

Sentiment:`;

      const response = await callGemini(prompt, 0.3);
      
      // Handle null response (no API key or API failure)
      if (!response) {
        console.log('🔄 Gemini API not available, using fallback sentiment analysis');
        return this.fallbackSentimentAnalysis(description);
      }
      
      const sentiment = response?.toLowerCase().trim();
      const validSentiments = ['urgent', 'frustrated', 'neutral', 'informational'];
      return validSentiments.includes(sentiment) ? sentiment : 'neutral';
    } catch (error) {
      console.error('Sentiment Analysis Error:', error);
      // Enhanced fallback sentiment analysis
      return this.fallbackSentimentAnalysis(description);
    }
  },

  // Enhanced fallback sentiment analysis
  fallbackSentimentAnalysis(description) {
    const desc = description.toLowerCase();
    
    // Urgent/Emergency indicators - expanded
    if (desc.includes('urgent') || desc.includes('emergency') || desc.includes('immediately') || 
        desc.includes('asap') || desc.includes('critical') || desc.includes('danger') ||
        desc.includes('hazard') || desc.includes('accident') || desc.includes('injury') ||
        desc.includes('life threatening') || desc.includes('safety risk')) {
      console.log(`🔴 Urgent sentiment detected: ${description.substring(0, 50)}...`);
      return 'urgent';
    }
    
    // Frustrated/Angry indicators - expanded for citizen complaints
    if (desc.includes('frustrated') || desc.includes('angry') || desc.includes('mad') || 
        desc.includes('sick') || desc.includes('tired') || desc.includes('fed up') ||
        desc.includes('disappointed') || desc.includes('neglect') || desc.includes('terrible') ||
        desc.includes('not properly') || desc.includes('not working') || desc.includes('broken') ||
        desc.includes('blocked') || desc.includes('patholes') || desc.includes('potholes') ||
        desc.includes('frequently') || desc.includes('again and again') || desc.includes('always')) {
      console.log(`😠 Frustrated sentiment detected: ${description.substring(0, 50)}...`);
      return 'frustrated';
    }
    
    // Informational indicators - simple reporting
    if (desc.includes('reporting') || desc.includes('informing') || desc.includes('bringing to attention') ||
        desc.includes('note') || desc.includes('fyi') || desc.includes('there is') ||
        desc.includes('would like to') || desc.includes('requesting') || desc.includes('please')) {
      console.log(`📝 Informational sentiment detected: ${description.substring(0, 50)}...`);
      return 'informational';
    }
    
    // Default to neutral - but only for truly neutral descriptions
    console.log(`😐 Neutral sentiment (default): ${description.substring(0, 50)}...`);
    return 'neutral';
  },

  /**
   * 7. AI Complaint Clustering
   * Groups similar complaints together
   */
  async getClusteredComplaints(Complaint) {
    try {
      // Get all complaints from last 60 days
      const allComplaints = await Complaint.find({
        createdAt: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
      }).select('id title description category location');

      if (allComplaints.length === 0) {
        return [];
      }

      // Group by category and location proximity
      const clusters = {};

      for (const complaint of allComplaints) {
        // Extract area from location (more flexible matching)
        const location = complaint.location.toLowerCase();
        let area = location;
        
        // Extract main area from location (before comma)
        if (location.includes(',')) {
          area = location.split(',')[0].trim();
        }
        
        // Create cluster key with category + main area
        const key = `${complaint.category}::${area}`;
        
        if (!clusters[key]) {
          clusters[key] = {
            category: complaint.category,
            location: area,
            complaints: [],
            count: 0
          };
        }
        clusters[key].complaints.push(complaint);
        clusters[key].count++;
      }

      console.log(`📊 Found ${Object.keys(clusters).length} potential clusters`);
      Object.keys(clusters).forEach(key => {
        console.log(`   - ${key}: ${clusters[key].count} complaints`);
      });

      // Return clusters with more than 1 complaint, sorted by count
      const result = Object.values(clusters)
        .filter(c => c.complaints.length > 1)
        .sort((a, b) => b.count - a.count);
      
      console.log(`📈 Returning ${result.length} clusters with multiple complaints`);
      return result;
    } catch (error) {
      console.error('Clustering Error:', error);
      return [];
    }
  },

  /**
   * 8. AI Complaint Recommendation System
   * Suggests possible solutions for complaints
   */
  async getRecommendation(description, category) {
    try {
      const prompt = `You are a government complaint resolution assistant. Based on the complaint category and description, suggest EXACTLY ONE actionable recommendation for the assigned officer.

The recommendation should be:
1. Specific and actionable
2. One sentence only (max 15 words)
3. Start with an action verb (Schedule, Inspect, Repair, Clean, etc.)

Category: ${category}

Examples:
- Road damage → "Schedule road inspection and repair assessment"
- Water leak → "Inspect water supply pipeline and test for contamination"
- Street light → "Replace broken bulb and check electrical connections"
- Garbage → "Schedule immediate cleaning and waste collection"
- Public safety → "Increase patrol in the area for 2 weeks"

Complaint: "${description}"

Recommendation:`;

      const response = await callGemini(prompt, 0.5);
      return response || 'Investigate complaint and take appropriate action';
    } catch (error) {
      console.error('Recommendation Error:', error);
      return 'Investigate complaint and take appropriate action';
    }
  },

  /**
   * Utility: Get AI insights for a complaint
   */
  async getCompleteInsights(description, category, location, User, Complaint) {
    try {
      const [priority, summary, sentiment, recommendation] = await Promise.all([
        this.detectPriority(description, category),
        this.summarizeComplaint(description),
        this.analyzeSentiment(description),
        this.getRecommendation(description, category)
      ]);

      return {
        priority,
        summary,
        sentiment,
        recommendation
      };
    } catch (error) {
      console.error('Complete Insights Error:', error);
      return {
        priority: 'MEDIUM',
        summary: description.substring(0, 100),
        sentiment: 'neutral',
        recommendation: 'Review and process complaint'
      };
    }
  }
};

export default aiService;
