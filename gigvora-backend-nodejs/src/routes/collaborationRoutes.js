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

const router = Router();

router.get('/spaces', index);
router.get('/spaces/:spaceId', show);
router.post('/spaces', store);
router.post('/spaces/:spaceId/video-rooms', storeRoom);
router.post('/spaces/:spaceId/assets', storeAsset);
router.post('/assets/:assetId/annotations', storeAnnotation);
router.post('/spaces/:spaceId/repositories', storeRepository);
router.post('/spaces/:spaceId/ai-sessions', storeAiSession);

export default router;
