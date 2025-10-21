import { Router } from 'express';
import multer from 'multer';
import * as userController from '../controllers/userController.js';
import * as careerDocumentController from '../controllers/careerDocumentController.js';
import * as creationStudioController from '../controllers/creationStudioController.js';
import * as userDisputeController from '../controllers/userDisputeController.js';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import { updateUserDashboardOverviewSchema } from '../validation/schemas/userDashboardSchemas.js';
import userConsentRoutes from './userConsentRoutes.js';
import userCalendarRoutes from './userCalendarRoutes.js';
import userNetworkingRoutes from './userNetworkingRoutes.js';
import userVolunteeringRoutes from './userVolunteeringRoutes.js';
import walletRoutes from './walletRoutes.js';
import userTimelineRoutes from './userTimelineRoutes.js';
import * as notificationController from '../controllers/notificationController.js';
import userGroupRoutes from './userGroupRoutes.js';
import userPageRoutes from './userPageRoutes.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const DASHBOARD_OWNER_ROLES = ['user', 'admin'];
const EXTENDED_ACCOUNT_ROLES = ['user', 'freelancer', 'agency', 'company', 'headhunter', 'admin'];
const COMMUNITY_ROLES = ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter', 'admin'];
const DOCUMENT_ROLES = ['user', 'freelancer', 'agency', 'company', 'headhunter', 'mentor', 'admin'];
const CREATION_STUDIO_ROLES = ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter', 'admin'];
const NOTIFICATION_ROLES = ['user', 'freelancer', 'agency', 'company', 'headhunter', 'mentor', 'admin'];

router.get('/', asyncHandler(userController.listUsers));

router.get(
  '/:id/dashboard',
  authenticate({ roles: DASHBOARD_OWNER_ROLES, matchParam: 'id' }),
  asyncHandler(userController.getUserDashboard),
);

router.get(
  '/:id/dashboard/overview',
  authenticate({ roles: EXTENDED_ACCOUNT_ROLES, matchParam: 'id' }),
  asyncHandler(userController.getUserDashboardOverview),
);

router.put(
  '/:id/dashboard/overview',
  authenticate({ roles: EXTENDED_ACCOUNT_ROLES, matchParam: 'id' }),
  validateRequest({ body: updateUserDashboardOverviewSchema }),
  asyncHandler(userController.updateUserDashboardOverview),
);

router.post(
  '/:id/dashboard/overview/refresh-weather',
  authenticate({ roles: EXTENDED_ACCOUNT_ROLES, matchParam: 'id' }),
  asyncHandler(userController.refreshUserDashboardOverviewWeather),
);

router.get(
  '/:id/profile-hub',
  authenticate({ roles: DASHBOARD_OWNER_ROLES, matchParam: 'id' }),
  asyncHandler(userController.getUserProfileHub),
);

router.get(
  '/:id/affiliate/dashboard',
  authenticate({ roles: EXTENDED_ACCOUNT_ROLES, matchParam: 'id' }),
  asyncHandler(userController.getUserAffiliateDashboard),
);

router.get(
  '/:id/alliances',
  authenticate({ roles: COMMUNITY_ROLES, matchParam: 'id' }),
  asyncHandler(userController.getFreelancerAlliances),
);

router.get(
  '/:id/support-desk',
  authenticate({ roles: COMMUNITY_ROLES, matchParam: 'id' }),
  asyncHandler(userController.getSupportDesk),
);

router.get(
  '/:id/catalog-insights',
  authenticate({ roles: COMMUNITY_ROLES, matchParam: 'id' }),
  asyncHandler(userController.getFreelancerCatalogInsights),
);

router.get(
  '/:id/gig-builder',
  authenticate({ roles: COMMUNITY_ROLES, matchParam: 'id' }),
  asyncHandler(userController.getFreelancerGigBuilder),
);

router.get(
  '/:id/gig-manager',
  authenticate({ roles: COMMUNITY_ROLES, matchParam: 'id' }),
  asyncHandler(userController.getGigManagerSnapshot),
);

router.get(
  '/:id/disputes',
  authenticate({ roles: COMMUNITY_ROLES, matchParam: 'id' }),
  userDisputeController.listUserDisputes,
);

router.get(
  '/:id/disputes/:disputeId',
  authenticate({ roles: COMMUNITY_ROLES, matchParam: 'id' }),
  userDisputeController.getUserDispute,
);

router.post(
  '/:id/disputes',
  authenticate({ roles: COMMUNITY_ROLES, matchParam: 'id' }),
  userDisputeController.createUserDispute,
);

router.post(
  '/:id/disputes/:disputeId/events',
  authenticate({ roles: COMMUNITY_ROLES, matchParam: 'id' }),
  userDisputeController.appendUserDisputeEvent,
);

router.get(
  '/:id/ai-settings',
  authenticate({ roles: DASHBOARD_OWNER_ROLES, matchParam: 'id' }),
  asyncHandler(userController.getUserAiSettings),
);

router.put(
  '/:id/ai-settings',
  authenticate({ roles: DASHBOARD_OWNER_ROLES, matchParam: 'id' }),
  asyncHandler(userController.updateUserAiSettings),
);

router.get(
  '/:id/website-preferences',
  authenticate({ roles: COMMUNITY_ROLES, matchParam: 'id' }),
  asyncHandler(userController.getWebsitePreferences),
);

router.put(
  '/:id/website-preferences',
  authenticate({ roles: COMMUNITY_ROLES, matchParam: 'id' }),
  asyncHandler(userController.updateWebsitePreferences),
);

router.get('/:id', asyncHandler(userController.getUserProfile));

router.put(
  '/:id',
  authenticate({ roles: DASHBOARD_OWNER_ROLES, matchParam: 'id' }),
  asyncHandler(userController.updateUser),
);

router.patch(
  '/:id/profile',
  authenticate({ roles: DASHBOARD_OWNER_ROLES, matchParam: 'id' }),
  asyncHandler(userController.updateProfileSettings),
);

router.put(
  '/:id/profile',
  authenticate({ roles: DASHBOARD_OWNER_ROLES, matchParam: 'id' }),
  asyncHandler(userController.updateUserProfileDetails),
);

router.post(
  '/:id/profile/avatar',
  authenticate({ roles: DASHBOARD_OWNER_ROLES, matchParam: 'id' }),
  upload.single('avatar'),
  asyncHandler(userController.updateUserProfileAvatar),
);

router.get(
  '/:id/profile/followers',
  authenticate({ roles: DASHBOARD_OWNER_ROLES, matchParam: 'id' }),
  asyncHandler(userController.listUserFollowers),
);

router.post(
  '/:id/profile/followers',
  authenticate({ roles: DASHBOARD_OWNER_ROLES, matchParam: 'id' }),
  asyncHandler(userController.saveUserFollower),
);

router.patch(
  '/:id/profile/followers/:followerId',
  authenticate({ roles: DASHBOARD_OWNER_ROLES, matchParam: 'id' }),
  asyncHandler(userController.saveUserFollower),
);

router.delete(
  '/:id/profile/followers/:followerId',
  authenticate({ roles: DASHBOARD_OWNER_ROLES, matchParam: 'id' }),
  asyncHandler(userController.deleteUserFollower),
);

router.get(
  '/:id/connections',
  authenticate({ roles: DASHBOARD_OWNER_ROLES, matchParam: 'id' }),
  asyncHandler(userController.listUserConnections),
);

router.patch(
  '/:id/connections/:connectionId',
  authenticate({ roles: DASHBOARD_OWNER_ROLES, matchParam: 'id' }),
  asyncHandler(userController.updateUserConnection),
);

router.use(
  '/:id/wallet',
  authenticate({ roles: COMMUNITY_ROLES, matchParam: 'id' }),
  walletRoutes,
);

router.use(
  '/:id/timeline',
  authenticate({ roles: COMMUNITY_ROLES, matchParam: 'id' }),
  userTimelineRoutes,
);

router.use(
  '/:id/groups',
  authenticate({ roles: COMMUNITY_ROLES, matchParam: 'id' }),
  userGroupRoutes,
);

router.use(
  '/:id/pages',
  authenticate({ roles: COMMUNITY_ROLES, matchParam: 'id' }),
  userPageRoutes,
);

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
  '/:id/cover-letters/workspace',
  authenticate({ roles: DOCUMENT_ROLES, matchParam: 'id' }),
  asyncHandler(careerDocumentController.getCoverLetterWorkspace),
);

router.post(
  '/:id/cover-letters',
  authenticate({ roles: DOCUMENT_ROLES, matchParam: 'id' }),
  asyncHandler(careerDocumentController.createCoverLetter),
);

router.post(
  '/:id/cover-letters/:documentId/upload',
  authenticate({ roles: DOCUMENT_ROLES, matchParam: 'id' }),
  asyncHandler(careerDocumentController.uploadCoverLetterVersion),
);

router.post(
  '/:id/story-blocks',
  authenticate({ roles: DOCUMENT_ROLES, matchParam: 'id' }),
  asyncHandler(careerDocumentController.createStoryBlock),
);

router.post(
  '/:id/story-blocks/:documentId/upload',
  authenticate({ roles: DOCUMENT_ROLES, matchParam: 'id' }),
  asyncHandler(careerDocumentController.uploadStoryBlockVersion),
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

router.use('/:id/volunteering', userVolunteeringRoutes);
router.use('/:id/consents', userConsentRoutes);

router.use(
  '/:id/networking',
  authenticate({ roles: COMMUNITY_ROLES, matchParam: 'id' }),
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

router.use(
  '/:id/calendar',
  authenticate({ roles: COMMUNITY_ROLES, matchParam: 'id' }),
  userCalendarRoutes,
);

export default router;
