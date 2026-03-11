import Complaint from '../models/Complaint.js';

export const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedbackMessage, isSatisfied } = req.body;
    const complaint = await Complaint.findOneAndUpdate(
      { id },
      { rating, feedbackMessage, isSatisfied, status: isSatisfied ? 'CLOSED' : 'REOPENED' },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
