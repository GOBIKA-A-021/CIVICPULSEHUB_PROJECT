import axios from 'axios';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || '';

// Must match the CATEGORIES in api.ts
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

export const aiService = {
  // AI Complaint Categorization
  async categorizeComplaint(description: string): Promise<string> {
    try {
      if (!OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured');
        return 'Public Safety'; // Default
      }

      const categoriesText = COMPLAINT_CATEGORIES.join(', ');
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a complaint categorization assistant. Analyze the complaint description and classify it into EXACTLY ONE of these categories: ${categoriesText}.
              
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

Examples:
- "potholes on main street" → "Road Maintenance"
- "cracked sidewalk" → "Road Maintenance"
- "road is damaged" → "Road Maintenance"
- "broken street light" → "Street Lighting"
- "no water from tap" → "Water Supply"
- "garbage piling up" → "Waste Management"
- "flooding in street" → "Drainage Issues"
- "pickpocketing in market" → "Public Safety"

Respond with ONLY the exact category name from the list, nothing else.`
            },
            {
              role: 'user',
              content: description
            }
          ],
          temperature: 0.1,
          max_tokens: 50
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let category = response.data.choices[0]?.message?.content?.trim() || 'Public Safety';
      
      // More lenient matching - check if returned category is close to any in our list
      const returnedLower = category.toLowerCase();
      const matched = COMPLAINT_CATEGORIES.find(cat => 
        cat.toLowerCase() === returnedLower || 
        cat.toLowerCase().includes(returnedLower) ||
        returnedLower.includes(cat.toLowerCase())
      );
      
      return matched || 'Public Safety';
    } catch (error) {
      console.error('AI Categorization Error:', error);
      return 'Public Safety'; // Default category
    }
  },

  // AI Complaint Summarization
  async summarizeComplaint(description: string): Promise<string> {
    try {
      if (!OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured');
        return description.substring(0, 50) + '...'; // Fallback
      }

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a complaint summarization assistant. Summarize the given complaint in ONE concise sentence (max 15 words). Respond with ONLY the summary, no punctuation at end.'
            },
            {
              role: 'user',
              content: description
            }
          ],
          temperature: 0.5,
          max_tokens: 50
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0]?.message?.content?.trim() || description.substring(0, 100);
    } catch (error) {
      console.error('AI Summarization Error:', error);
      return description.substring(0, 100);
    }
  },

  // Predict Priority based on description
  async predictPriority(description: string, category: string): Promise<'LOW' | 'MEDIUM' | 'HIGH'> {
    try {
      if (!OPENAI_API_KEY) return 'MEDIUM';

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a complaint priority assessment assistant. Based on the complaint category and description, assess the urgency.

Category: ${category}

RULES:
- HIGH: Affects public safety, infrastructure damage, health risks, emergency situations, large-scale impact
- MEDIUM: Important but not urgent, affects services, moderate inconvenience
- LOW: Minor issues, no immediate risk, routine maintenance

Respond with ONLY one word: HIGH, MEDIUM, or LOW`
            },
            {
              role: 'user',
              content: description
            }
          ],
          temperature: 0.1,
          max_tokens: 20
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const priority = response.data.choices[0]?.message?.content?.trim().toUpperCase() || 'MEDIUM';
      return (priority === 'HIGH' || priority === 'LOW' ? priority : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH';
    } catch (error) {
      console.error('Priority Prediction Error:', error);
      return 'MEDIUM';
    }
  },

  // Sentiment Analysis
  async analyzeSentiment(description: string): Promise<string> {
    try {
      if (!OPENAI_API_KEY) return 'neutral';

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Analyze the tone/sentiment of the complaint. Respond with ONLY one word: frustrated, angry, concerned, or calm'
            },
            {
              role: 'user',
              content: description
            }
          ],
          temperature: 0.1,
          max_tokens: 20
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0]?.message?.content?.trim().toLowerCase() || 'neutral';
    } catch (error) {
      console.error('Sentiment Analysis Error:', error);
      return 'neutral';
    }
  },

  // Estimated time to resolve
  async estimateResolutionTime(category: string, priority: string): Promise<string> {
    const estimates: { [key: string]: { [key: string]: string } } = {
      'Road Maintenance': { HIGH: '3-5 days', MEDIUM: '1-2 weeks', LOW: '2-4 weeks' },
      'Street Lighting': { HIGH: '2-3 days', MEDIUM: '1 week', LOW: '2 weeks' },
      'Water Supply': { HIGH: '1-2 days', MEDIUM: '3-7 days', LOW: '1-2 weeks' },
      'Drainage Issues': { HIGH: '2-3 days', MEDIUM: '1 week', LOW: '2-3 weeks' },
      'Electricity': { HIGH: '1-2 days', MEDIUM: '3-5 days', LOW: '1 week' },
      'Waste Management': { HIGH: '2-3 days', MEDIUM: '1-2 weeks', LOW: '2-4 weeks' },
      'Public Safety': { HIGH: '24 hours', MEDIUM: '2-3 days', LOW: '1 week' },
      'Sanitation': { HIGH: '2-3 days', MEDIUM: '1-2 weeks', LOW: '3-4 weeks' }
    };

    return estimates[category]?.[priority] || estimates['Road Maintenance']?.[priority] || '1-2 weeks';
  }
};
