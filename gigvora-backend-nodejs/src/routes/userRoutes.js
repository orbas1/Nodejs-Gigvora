import { Router } from 'express';
import multer from 'multer';
import * as userController from '../controllers/userController.js';
import * as careerDocumentController from '../controllers/careerDocumentController.js';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middleware/authenticate.js';
import userConsentRoutes from './userConsentRoutes.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', asyncHandler(userController.listUsers));
router.get(
  '/:id/dashboard',
  authenticate({ roles: ['user', 'admin'], matchParam: 'id' }),
  asyncHandler(userController.getUserDashboard),
);
router.get(
  '/:id/profile-hub',
  authenticate({ roles: ['user', 'admin'], matchParam: 'id' }),
  asyncHandler(userController.getUserProfileHub),
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
router.put(
  '/:id/profile',
  authenticate({ roles: ['user', 'admin'], matchParam: 'id' }),
  asyncHandler(userController.updateUserProfileDetails),
);
router.post(
  '/:id/profile/avatar',
  authenticate({ roles: ['user', 'admin'], matchParam: 'id' }),
  upload.single('avatar'),
  asyncHandler(userController.updateUserProfileAvatar),
);
router.get(
  '/:id/profile/followers',
  authenticate({ roles: ['user', 'admin'], matchParam: 'id' }),
  asyncHandler(userController.listUserFollowers),
);
router.post(
  '/:id/profile/followers',
  authenticate({ roles: ['user', 'admin'], matchParam: 'id' }),
  asyncHandler(userController.saveUserFollower),
);
router.patch(
  '/:id/profile/followers/:followerId',
  authenticate({ roles: ['user', 'admin'], matchParam: 'id' }),
  asyncHandler(userController.saveUserFollower),
);
router.delete(
  '/:id/profile/followers/:followerId',
  authenticate({ roles: ['user', 'admin'], matchParam: 'id' }),
  asyncHandler(userController.deleteUserFollower),
);
router.get(
  '/:id/connections',
  authenticate({ roles: ['user', 'admin'], matchParam: 'id' }),
  asyncHandler(userController.listUserConnections),
);
router.patch(
  '/:id/connections/:connectionId',
  authenticate({ roles: ['user', 'admin'], matchParam: 'id' }),
  asyncHandler(userController.updateUserConnection),
);

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

export default router;
