import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.post('/register', asyncHandler(authController.registerUser));
router.post('/register/company', asyncHandler(authController.registerCompany));
router.post('/register/agency', asyncHandler(authController.registerAgency));
router.post('/login', asyncHandler(authController.login));
router.post('/admin/login', asyncHandler(authController.adminLogin));
router.post('/verify-2fa', asyncHandler(authController.verifyTwoFactor));
router.post('/two-factor/resend', asyncHandler(authController.resendTwoFactor));
router.post('/login/google', asyncHandler(authController.googleLogin));

export default router;
