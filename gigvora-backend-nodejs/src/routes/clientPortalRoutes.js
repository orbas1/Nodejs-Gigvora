import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import clientPortalController from '../controllers/clientPortalController.js';

const router = Router();

router.post('/', asyncHandler(clientPortalController.store));
router.patch('/:portalId', asyncHandler(clientPortalController.update));
router.get('/:portalId/dashboard', asyncHandler(clientPortalController.dashboard));
router.post('/:portalId/timeline-events', asyncHandler(clientPortalController.storeTimelineEvent));
router.patch('/:portalId/timeline-events/:eventId', asyncHandler(clientPortalController.updateTimeline));
router.post('/:portalId/scope-items', asyncHandler(clientPortalController.storeScopeItem));
router.patch('/:portalId/scope-items/:itemId', asyncHandler(clientPortalController.updateScope));
router.post('/:portalId/decisions', asyncHandler(clientPortalController.storeDecision));
router.post('/:portalId/insights', asyncHandler(clientPortalController.storeInsight));
router.patch('/:portalId/insights/:widgetId', asyncHandler(clientPortalController.updateInsight));

export default router;
