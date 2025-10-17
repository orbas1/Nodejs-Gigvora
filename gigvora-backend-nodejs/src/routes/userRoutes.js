import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import * as careerDocumentController from '../controllers/careerDocumentController.js';
import * as userDisputeController from '../controllers/userDisputeController.js';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middleware/authenticate.js';
import userConsentRoutes from './userConsentRoutes.js';
import userNetworkingRoutes from './userNetworkingRoutes.js';
import userVolunteeringRoutes from './userVolunteeringRoutes.js';
import walletRoutes from './walletRoutes.js';
import * as notificationController from '../controllers/notificationController.js';

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
  '/:id/disputes',
  authenticate({ roles: ['user', 'freelancer', 'agency', 'company', 'headhunter', 'admin'], matchParam: 'id' }),
  userDisputeController.listUserDisputes,
);
router.get(
  '/:id/disputes/:disputeId',
  authenticate({ roles: ['user', 'freelancer', 'agency', 'company', 'headhunter', 'admin'], matchParam: 'id' }),
  userDisputeController.getUserDispute,
);
router.post(
  '/:id/disputes',
  authenticate({ roles: ['user', 'freelancer', 'agency', 'company', 'headhunter', 'admin'], matchParam: 'id' }),
  userDisputeController.createUserDispute,
);
router.post(
  '/:id/disputes/:disputeId/events',
  authenticate({ roles: ['user', 'freelancer', 'agency', 'company', 'headhunter', 'admin'], matchParam: 'id' }),
  userDisputeController.appendUserDisputeEvent,
);
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
router.get(
  '/:id/website-preferences',
  authenticate({ roles: ['user', 'freelancer', 'agency', 'company', 'headhunter', 'admin'], matchParam: 'id' }),
  asyncHandler(userController.getWebsitePreferences),
);
router.put(
  '/:id/website-preferences',
  authenticate({ roles: ['user', 'freelancer', 'agency', 'company', 'headhunter', 'admin'], matchParam: 'id' }),
  asyncHandler(userController.updateWebsitePreferences),
);
router.get('/:id', asyncHandler(userController.getUserProfile));
router.put('/:id', asyncHandler(userController.updateUser));
router.patch('/:id/profile', asyncHandler(userController.updateProfileSettings));

router.use(
  '/:id/wallet',
  authenticate({
    roles: ['user', 'freelancer', 'agency', 'company', 'headhunter', 'admin'],
    matchParam: 'id',
  }),
  walletRoutes,
);

const DOCUMENT_ROLES = ['user', 'freelancer', 'agency', 'company', 'headhunter', 'mentor', 'admin'];
const NOTIFICATION_ROLES = ['user', 'freelancer', 'agency', 'company', 'headhunter', 'mentor', 'admin'];

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

router.use('/:id/volunteering', userVolunteeringRoutes);

router.use('/:id/consents', userConsentRoutes);
router.use(
  '/:id/networking',
  authenticate({
    roles: ['user', 'freelancer', 'agency', 'company', 'headhunter', 'mentor', 'admin'],
    matchParam: 'id',
  }),
  userNetworkingRoutes,
);

router.get(
  '/:id/notifications',
  authenticate({ roles: NOTIFICATION_ROLES, matchParam: 'id' }),
  asyncHandler(notificationController.listUserNotifications),
);
router.post(
  '/:id/notifications',
  authenticate({ roles: NOTIFICATION_ROLES, matchParam: 'id' }),
  asyncHandler(notificationController.createUserNotification),
);
router.patch(
  '/:id/notifications/:notificationId',
  authenticate({ roles: NOTIFICATION_ROLES, matchParam: 'id' }),
  asyncHandler(notificationController.updateUserNotification),
);
router.get(
  '/:id/notifications/preferences',
  authenticate({ roles: NOTIFICATION_ROLES, matchParam: 'id' }),
  asyncHandler(notificationController.getUserNotificationPreferences),
);
router.put(
  '/:id/notifications/preferences',
  authenticate({ roles: NOTIFICATION_ROLES, matchParam: 'id' }),
  asyncHandler(notificationController.updateUserNotificationPreferences),
);
router.post(
  '/:id/notifications/mark-all-read',
  authenticate({ roles: NOTIFICATION_ROLES, matchParam: 'id' }),
  asyncHandler(notificationController.markAllUserNotificationsRead),
);

export default router;
