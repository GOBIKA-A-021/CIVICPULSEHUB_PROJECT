import express from 'express';
import { signup, login, forgotPassword, resetPassword, forgotPasswordAlternative, resetPasswordBySecurity, setupSecurityQuestions } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/forgot-password-alternative', forgotPasswordAlternative);
router.post('/reset-password-security', resetPasswordBySecurity);
router.post('/setup-security-questions', setupSecurityQuestions);

export default router;
