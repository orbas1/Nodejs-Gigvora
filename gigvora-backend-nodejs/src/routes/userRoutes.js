import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import * as careerDocumentController from '../controllers/careerDocumentController.js';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middleware/authenticate.js';
import userConsentRoutes from './userConsentRoutes.js';
import userCalendarRoutes from './userCalendarRoutes.js';

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
router.get(
  '/:id/ai-settings',
  authenticate({ roles: ['user', 'admin'], matchParam: 'id' }),
  asyncHandler(userController.getUserAiSettings),
);
router.put(
  '/:id/ai-settings',
  authenticate({ roles: ['user', 'admin'], matchParam: 'id' }),
  asyncHandler(userController.updateUserAiSettings),
);
router.get('/:id', asyncHandler(userController.getUserProfile));
router.put('/:id', asyncHandler(userController.updateUser));
router.patch('/:id/profile', asyncHandler(userController.updateProfileSettings));

const DOCUMENT_ROLES = ['user', 'freelancer', 'agency', 'company', 'headhunter', 'mentor', 'admin'];

router.get(
  '/:id/cv-documents/workspace',
  authenticate({ roles: DOCUMENT_ROLES, matchParam: 'id' }),
  asyncHandler(careerDocumentController.getWorkspace),
);
router.post(
  '/:id/cv-documents',
  authenticate({ roles: DOCUMENT_ROLES, matchParam: 'id' }),
  asyncHandler(careerDocumentController.createDocument),
);
router.post(
  '/:id/cv-documents/:documentId/upload',
  authenticate({ roles: DOCUMENT_ROLES, matchParam: 'id' }),
  asyncHandler(careerDocumentController.uploadVersion),
);

router.use('/:id/consents', userConsentRoutes);

router.use(
  '/:id/calendar',
  authenticate({
    roles: ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter', 'admin'],
    matchParam: 'id',
  }),
  userCalendarRoutes,
);

export default router;
