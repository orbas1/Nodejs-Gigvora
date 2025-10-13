import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import networkingController from '../controllers/networkingController.js';

const router = Router();

router.get('/sessions', asyncHandler(networkingController.index));
router.post('/sessions', asyncHandler(networkingController.create));
router.get('/sessions/:sessionId', asyncHandler(networkingController.show));
router.put('/sessions/:sessionId', asyncHandler(networkingController.update));
router.post(
  '/sessions/:sessionId/rotations/regenerate',
  asyncHandler(networkingController.regenerateRotations),
);
router.post('/sessions/:sessionId/signups', asyncHandler(networkingController.register));
router.patch(
  '/sessions/:sessionId/signups/:signupId',
  asyncHandler(networkingController.updateSignup),
);
router.get('/sessions/:sessionId/runtime', asyncHandler(networkingController.runtime));

router.get('/business-cards', asyncHandler(networkingController.listBusinessCards));
router.post('/business-cards', asyncHandler(networkingController.createBusinessCard));
router.put('/business-cards/:cardId', asyncHandler(networkingController.updateBusinessCard));

export default router;
