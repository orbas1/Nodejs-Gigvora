import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();

router.get('/', asyncHandler(userController.listUsers));
router.get(
  '/:id/dashboard',
  authenticate({ roles: ['user', 'admin'], matchParam: 'id' }),
  asyncHandler(userController.getUserDashboard),
);
router.get(
  '/:id/affiliate/dashboard',
  authenticate({ roles: ['user', 'freelancer', 'agency', 'company', 'headhunter', 'admin'], matchParam: 'id' }),
  asyncHandler(userController.getUserAffiliateDashboard),
);
router.get('/:id/alliances', asyncHandler(userController.getFreelancerAlliances));
router.get('/:id/support-desk', asyncHandler(userController.getSupportDesk));
router.get('/:id/catalog-insights', asyncHandler(userController.getFreelancerCatalogInsights));
router.get('/:id/gig-builder', asyncHandler(userController.getFreelancerGigBuilder));
router.get('/:id/gig-manager', asyncHandler(userController.getGigManagerSnapshot));
router.get('/:id', asyncHandler(userController.getUserProfile));
router.put('/:id', asyncHandler(userController.updateUser));
router.patch('/:id/profile', asyncHandler(userController.updateProfileSettings));

export default router;
