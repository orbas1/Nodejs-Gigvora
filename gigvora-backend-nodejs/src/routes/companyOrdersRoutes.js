import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  dashboard,
  create,
  update,
  remove,
  detail,
  addTimelineEvent,
  updateTimelineEvent,
  removeTimelineEvent,
  postMessage,
  createEscrowCheckpoint,
  updateEscrowCheckpoint,
  submitReview,
} from '../controllers/companyOrdersController.js';
import {
  dashboardQuerySchema,
  orderIdParamsSchema,
  timelineParamsSchema,
  checkpointParamsSchema,
  createOrderBodySchema,
  updateOrderBodySchema,
  createTimelineBodySchema,
  updateTimelineBodySchema,
  messageBodySchema,
  createEscrowBodySchema,
  updateEscrowBodySchema,
  reviewBodySchema,
} from '../validation/schemas/companyOrdersSchemas.js';

const router = Router();

router.use(authenticateRequest());
router.use(requireRoles(['company', 'admin']));

router.get('/', validateRequest({ query: dashboardQuerySchema }), asyncHandler(dashboard));
router.post('/', validateRequest({ body: createOrderBodySchema }), asyncHandler(create));
router.get('/:orderId', validateRequest({ params: orderIdParamsSchema }), asyncHandler(detail));
router.patch(
  '/:orderId',
  validateRequest({ params: orderIdParamsSchema, body: updateOrderBodySchema }),
  asyncHandler(update),
);
router.delete('/:orderId', validateRequest({ params: orderIdParamsSchema }), asyncHandler(remove));

router.post(
  '/:orderId/timeline',
  validateRequest({ params: orderIdParamsSchema, body: createTimelineBodySchema }),
  asyncHandler(addTimelineEvent),
);
router.patch(
  '/:orderId/timeline/:eventId',
  validateRequest({ params: timelineParamsSchema, body: updateTimelineBodySchema }),
  asyncHandler(updateTimelineEvent),
);
router.delete(
  '/:orderId/timeline/:eventId',
  validateRequest({ params: timelineParamsSchema }),
  asyncHandler(removeTimelineEvent),
);

router.post(
  '/:orderId/messages',
  validateRequest({ params: orderIdParamsSchema, body: messageBodySchema }),
  asyncHandler(postMessage),
);

router.post(
  '/:orderId/escrow',
  validateRequest({ params: orderIdParamsSchema, body: createEscrowBodySchema }),
  asyncHandler(createEscrowCheckpoint),
);
router.patch(
  '/:orderId/escrow/:checkpointId',
  validateRequest({ params: checkpointParamsSchema, body: updateEscrowBodySchema }),
  asyncHandler(updateEscrowCheckpoint),
);

router.post(
  '/:orderId/review',
  validateRequest({ params: orderIdParamsSchema, body: reviewBodySchema }),
  asyncHandler(submitReview),
);

export default router;
