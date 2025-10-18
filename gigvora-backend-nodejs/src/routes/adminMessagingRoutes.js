import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as controller from '../controllers/adminMessagingController.js';
import {
  adminMessagingListQuerySchema,
  adminMessagingCreateThreadSchema,
  adminMessagingSendMessageSchema,
  adminMessagingChangeStateSchema,
  adminMessagingEscalateSchema,
  adminMessagingAssignSchema,
  adminMessagingSupportStatusSchema,
  adminMessagingLabelSchema,
  adminMessagingApplyLabelsSchema,
} from '../validation/schemas/adminMessagingSchemas.js';

const router = Router();

router.get(
  '/threads',
  validateRequest({ query: adminMessagingListQuerySchema }),
  asyncHandler(controller.index),
);

router.post(
  '/threads',
  validateRequest({ body: adminMessagingCreateThreadSchema }),
  asyncHandler(controller.createThread),
);

router.get('/threads/:threadId', asyncHandler(controller.show));

router.patch(
  '/threads/:threadId',
  validateRequest({ body: adminMessagingChangeStateSchema }),
  asyncHandler(controller.changeState),
);

router.get(
  '/threads/:threadId/messages',
  validateRequest({ query: adminMessagingListQuerySchema.partial() }),
  asyncHandler(controller.messages),
);

router.post(
  '/threads/:threadId/messages',
  validateRequest({ body: adminMessagingSendMessageSchema }),
  asyncHandler(controller.sendMessage),
);

router.post(
  '/threads/:threadId/escalate',
  validateRequest({ body: adminMessagingEscalateSchema }),
  asyncHandler(controller.escalate),
);

router.post(
  '/threads/:threadId/assign',
  validateRequest({ body: adminMessagingAssignSchema }),
  asyncHandler(controller.assign),
);

router.post(
  '/threads/:threadId/support-status',
  validateRequest({ body: adminMessagingSupportStatusSchema }),
  asyncHandler(controller.updateSupportStatus),
);

router.post(
  '/threads/:threadId/labels',
  validateRequest({ body: adminMessagingApplyLabelsSchema }),
  asyncHandler(controller.applyLabels),
);

router.get('/labels', asyncHandler(controller.labels));
router.post(
  '/labels',
  validateRequest({ body: adminMessagingLabelSchema }),
  asyncHandler(controller.createLabel),
);
router.patch(
  '/labels/:labelId',
  validateRequest({ body: adminMessagingLabelSchema.partial() }),
  asyncHandler(controller.updateLabel),
);
router.delete('/labels/:labelId', asyncHandler(controller.removeLabel));

router.get('/support-agents', asyncHandler(controller.supportAgents));

export default router;
