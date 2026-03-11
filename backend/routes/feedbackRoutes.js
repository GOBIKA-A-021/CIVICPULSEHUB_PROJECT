import express from 'express';
import { submitFeedback } from '../controllers/feedbackController.js';
import authenticate from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/:id', authenticate, submitFeedback);

export default router;
