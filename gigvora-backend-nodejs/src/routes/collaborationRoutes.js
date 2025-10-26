import { Router } from 'express';
import {
  index,
  show,
  store,
  storeRoom,
  storeAsset,
  storeAnnotation,
  storeRepository,
  storeAiSession,
} from '../controllers/collaborationController.js';
import * as huddleController from '../controllers/huddleController.js';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest } from '../middleware/authentication.js';

const router = Router();

router.get('/spaces', index);
router.get('/spaces/:spaceId', show);
router.post('/spaces', store);
router.post('/spaces/:spaceId/video-rooms', storeRoom);
router.post('/spaces/:spaceId/assets', storeAsset);
router.post('/assets/:assetId/annotations', storeAnnotation);
router.post('/spaces/:spaceId/repositories', storeRepository);
router.post('/spaces/:spaceId/ai-sessions', storeAiSession);

router.get(
  '/huddles/context',
  authenticateRequest({ optional: true }),
  asyncHandler(huddleController.context),
);
router.get(
  '/huddles/recommended-participants',
  authenticateRequest({ optional: true }),
  asyncHandler(huddleController.recommended),
);
router.post('/huddles', authenticateRequest(), asyncHandler(huddleController.store));
router.post(
  '/huddles/:huddleId/schedule',
  authenticateRequest(),
  asyncHandler(huddleController.schedule),
);
router.post('/huddles/instant', authenticateRequest(), asyncHandler(huddleController.launch));

export default router;
