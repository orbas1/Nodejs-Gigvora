import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  adminLoginSchema,
  googleLoginSchema,
  loginSchema,
  registerAgencySchema,
  registerCompanySchema,
  registerUserSchema,
  resendTwoFactorSchema,
  refreshSessionSchema,
  requestPasswordResetSchema,
  revokeRefreshTokenSchema,
  verifyPasswordResetTokenSchema,
  performPasswordResetSchema,
  verifyTwoFactorSchema,
} from '../validation/schemas/authSchemas.js';

const router = Router();

router.post('/register', validateRequest({ body: registerUserSchema }), asyncHandler(authController.registerUser));
router.post(
  '/register/company',
  validateRequest({ body: registerCompanySchema }),
  asyncHandler(authController.registerCompany),
);
router.post(
  '/register/agency',
  validateRequest({ body: registerAgencySchema }),
  asyncHandler(authController.registerAgency),
);
router.post('/login', validateRequest({ body: loginSchema }), asyncHandler(authController.login));
router.post('/admin/login', validateRequest({ body: adminLoginSchema }), asyncHandler(authController.adminLogin));
router.post(
  '/verify-2fa',
  validateRequest({ body: verifyTwoFactorSchema }),
  asyncHandler(authController.verifyTwoFactor),
);
router.post(
  '/two-factor/resend',
  validateRequest({ body: resendTwoFactorSchema }),
  asyncHandler(authController.resendTwoFactor),
);
router.post('/login/google', validateRequest({ body: googleLoginSchema }), asyncHandler(authController.googleLogin));
router.post('/refresh', validateRequest({ body: refreshSessionSchema }), asyncHandler(authController.refreshSession));
router.post(
  '/logout',
  validateRequest({ body: revokeRefreshTokenSchema }),
  asyncHandler(authController.logout),
);
router.post(
  '/password/forgot',
  validateRequest({ body: requestPasswordResetSchema }),
  asyncHandler(authController.requestPasswordReset),
);
router.post(
  '/password/verify',
  validateRequest({ body: verifyPasswordResetTokenSchema }),
  asyncHandler(authController.verifyPasswordResetToken),
);
router.post(
  '/password/reset',
  validateRequest({ body: performPasswordResetSchema }),
  asyncHandler(authController.resetPassword),
);

export default router;
