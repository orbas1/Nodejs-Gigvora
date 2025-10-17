import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import agencyController from '../controllers/agencyController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  agencyProfileQuerySchema,
  listFollowersQuerySchema,
  updateAgencyProfileSchema,
  updateAgencyAvatarSchema,
  followerParamsSchema,
  updateFollowerBodySchema,
  connectionParamsSchema,
  requestConnectionBodySchema,
  respondConnectionBodySchema,
} from '../validation/schemas/agencySchemas.js';

const router = Router();

router.get(
  '/dashboard',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.dashboard),
);

router.get(
  '/profile',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: agencyProfileQuerySchema }),
  asyncHandler(agencyController.getProfile),
);

router.put(
  '/profile',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: updateAgencyProfileSchema }),
  asyncHandler(agencyController.updateProfile),
);

router.put(
  '/profile/avatar',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: updateAgencyAvatarSchema }),
  asyncHandler(agencyController.updateAvatar),
);

router.get(
  '/profile/followers',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: listFollowersQuerySchema }),
  asyncHandler(agencyController.listFollowers),
);

router.patch(
  '/profile/followers/:followerId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: followerParamsSchema, body: updateFollowerBodySchema }),
  asyncHandler(agencyController.updateFollower),
);

router.delete(
  '/profile/followers/:followerId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: followerParamsSchema }),
  asyncHandler(agencyController.removeFollower),
);

router.get(
  '/profile/connections',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.listConnections),
);

router.post(
  '/profile/connections',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: requestConnectionBodySchema }),
  asyncHandler(agencyController.requestConnection),
);

router.post(
  '/profile/connections/:connectionId/respond',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: connectionParamsSchema, body: respondConnectionBodySchema }),
  asyncHandler(agencyController.respondToConnection),
);

router.delete(
  '/profile/connections/:connectionId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: connectionParamsSchema }),
  asyncHandler(agencyController.removeConnection),
);

export default router;

