import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import networkingController from '../controllers/networkingController.js';
import { authenticateRequest } from '../middleware/authentication.js';
import { requireNetworkingManager } from '../middleware/networkingAccess.js';

const router = Router();

router.get(
  '/sessions',
  authenticateRequest(),
  requireNetworkingManager(),
  asyncHandler(networkingController.index),
);
router.post(
  '/sessions',
  authenticateRequest(),
  requireNetworkingManager(),
  asyncHandler(networkingController.create),
);
router.get(
  '/sessions/:sessionId',
  authenticateRequest(),
  requireNetworkingManager(),
  asyncHandler(networkingController.show),
);
router.put(
  '/sessions/:sessionId',
  authenticateRequest(),
  requireNetworkingManager(),
  asyncHandler(networkingController.update),
);
router.post(
  '/sessions/:sessionId/rotations/regenerate',
  authenticateRequest(),
  requireNetworkingManager(),
  asyncHandler(networkingController.regenerateRotations),
);
router.post(
  '/sessions/:sessionId/signups',
  authenticateRequest({ optional: true }),
  asyncHandler(networkingController.register),
);
router.patch(
  '/sessions/:sessionId/signups/:signupId',
  authenticateRequest(),
  requireNetworkingManager(),
  asyncHandler(networkingController.updateSignup),
);
router.get(
  '/sessions/:sessionId/runtime',
  authenticateRequest(),
  requireNetworkingManager(),
  asyncHandler(networkingController.runtime),
);

router.get(
  '/business-cards',
  authenticateRequest(),
  requireNetworkingManager(),
  asyncHandler(networkingController.listBusinessCards),
);
router.post(
  '/business-cards',
  authenticateRequest(),
  requireNetworkingManager(),
  asyncHandler(networkingController.createBusinessCard),
);
router.put(
  '/business-cards/:cardId',
  authenticateRequest(),
  requireNetworkingManager(),
  asyncHandler(networkingController.updateBusinessCard),
);

export default router;
