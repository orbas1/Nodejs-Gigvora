import { Router } from 'express';
import * as messagingController from '../controllers/messagingController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/threads', asyncHandler(messagingController.listInbox));
router.post('/threads', asyncHandler(messagingController.createConversation));
router.get('/threads/:threadId', asyncHandler(messagingController.openThread));
router.get('/threads/:threadId/messages', asyncHandler(messagingController.listThreadMessages));
router.post('/threads/:threadId/messages', asyncHandler(messagingController.postMessage));
router.post('/threads/:threadId/calls', asyncHandler(messagingController.createCallSession));
router.post('/threads/:threadId/read', asyncHandler(messagingController.acknowledgeThread));
router.post('/threads/:threadId/state', asyncHandler(messagingController.changeThreadState));
router.post('/threads/:threadId/mute', asyncHandler(messagingController.muteConversation));
router.post('/threads/:threadId/escalate', asyncHandler(messagingController.escalateThread));
router.post('/threads/:threadId/assign-support', asyncHandler(messagingController.assignSupport));
router.post('/threads/:threadId/support-status', asyncHandler(messagingController.updateSupportStatus));
router.post('/threads/:threadId/settings', asyncHandler(messagingController.updateThreadSettings));
router.post('/threads/:threadId/participants', asyncHandler(messagingController.addParticipants));
router.delete(
  '/threads/:threadId/participants/:participantId',
  asyncHandler(messagingController.removeParticipant),
);

export default router;
