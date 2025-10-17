import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import * as careerDocumentController from '../controllers/careerDocumentController.js';
import * as creationStudioController from '../controllers/creationStudioController.js';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middleware/authenticate.js';
import userConsentRoutes from './userConsentRoutes.js';

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
const CREATION_STUDIO_ROLES = ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter', 'admin'];

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

router.get(
  '/:id/creation-studio',
  authenticate({ roles: CREATION_STUDIO_ROLES, matchParam: 'id' }),
  asyncHandler(creationStudioController.getWorkspace),
);
router.post(
  '/:id/creation-studio',
  authenticate({ roles: CREATION_STUDIO_ROLES, matchParam: 'id' }),
  asyncHandler(creationStudioController.createItem),
);
router.put(
  '/:id/creation-studio/:itemId',
  authenticate({ roles: CREATION_STUDIO_ROLES, matchParam: 'id' }),
  asyncHandler(creationStudioController.updateItem),
);
router.post(
  '/:id/creation-studio/:itemId/steps/:stepKey',
  authenticate({ roles: CREATION_STUDIO_ROLES, matchParam: 'id' }),
  asyncHandler(creationStudioController.recordStep),
);
router.post(
  '/:id/creation-studio/:itemId/share',
  authenticate({ roles: CREATION_STUDIO_ROLES, matchParam: 'id' }),
  asyncHandler(creationStudioController.shareItem),
);
router.delete(
  '/:id/creation-studio/:itemId',
  authenticate({ roles: CREATION_STUDIO_ROLES, matchParam: 'id' }),
  asyncHandler(creationStudioController.archiveItem),
);

router.use('/:id/consents', userConsentRoutes);

export default router;
