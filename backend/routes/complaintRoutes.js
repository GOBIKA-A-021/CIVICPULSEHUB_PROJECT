import express from 'express';
import { getComplaints, createComplaint, updateComplaint, getOfficers, downloadComplaintPDF, suggestOfficer, migrateResolvedAt } from '../controllers/complaintController.js';
import authenticate from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticate, getComplaints);
router.post('/', authenticate, createComplaint);
router.patch('/:id', authenticate, updateComplaint);
router.get('/officers', authenticate, getOfficers);
router.post('/suggest-officer', authenticate, suggestOfficer);
router.get('/:id/pdf', authenticate, downloadComplaintPDF);
router.post('/migrate-resolved-at', migrateResolvedAt);

export default router;
