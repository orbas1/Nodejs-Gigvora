import { Router } from 'express';
import * as messagingController from '../controllers/messagingController.js';
import * as inboxController from '../controllers/inboxController.js';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import { authenticateRequest } from '../middleware/authentication.js';
import {
  threadParamsSchema,
  listThreadsQuerySchema,
  createThreadBodySchema,
  listMessagesQuerySchema,
  createMessageBodySchema,
  callSessionBodySchema,
  threadStateBodySchema,
  muteThreadBodySchema,
  escalateThreadBodySchema,
  assignSupportBodySchema,
  supportStatusBodySchema,
  threadSettingsBodySchema,
  addParticipantsBodySchema,
  participantParamsSchema,
  threadDetailQuerySchema,
  typingStateBodySchema,
  searchThreadsQuerySchema,
  createTranscriptBodySchema,
  enforceRetentionBodySchema,
} from '../validation/schemas/messagingSchemas.js';

const router = Router();

router.use(authenticateRequest());

router.get(
  '/threads',
  validateRequest({ query: listThreadsQuerySchema }),
  asyncHandler(messagingController.listInbox),
);
router.post(
  '/threads',
  validateRequest({ body: createThreadBodySchema }),
  asyncHandler(messagingController.createConversation),
);
router.get(
  '/threads/search',
  validateRequest({ query: searchThreadsQuerySchema }),
  asyncHandler(messagingController.searchThreads),
);

router.get(
  '/threads/:threadId',
  validateRequest({ params: threadParamsSchema, query: threadDetailQuerySchema }),
  asyncHandler(messagingController.openThread),
);
router.get(
  '/threads/:threadId/messages',
  validateRequest({ params: threadParamsSchema, query: listMessagesQuerySchema }),
  asyncHandler(messagingController.listThreadMessages),
);
router.post(
  '/threads/:threadId/messages',
  validateRequest({ params: threadParamsSchema, body: createMessageBodySchema }),
  asyncHandler(messagingController.postMessage),
);
router.get(
  '/threads/:threadId/transcripts',
  validateRequest({ params: threadParamsSchema }),
  asyncHandler(messagingController.listThreadTranscripts),
);
router.post(
  '/threads/:threadId/transcripts',
  validateRequest({ params: threadParamsSchema, body: createTranscriptBodySchema }),
  asyncHandler(messagingController.createThreadTranscript),
);
router.post(
  '/threads/:threadId/calls',
  validateRequest({ params: threadParamsSchema, body: callSessionBodySchema }),
  asyncHandler(messagingController.createCallSession),
);
router.post(
  '/threads/:threadId/typing',
  validateRequest({ params: threadParamsSchema, body: typingStateBodySchema }),
  asyncHandler(messagingController.updateTypingState),
);
router.post(
  '/threads/:threadId/read',
  validateRequest({ params: threadParamsSchema }),
  asyncHandler(messagingController.acknowledgeThread),
);
router.post(
  '/threads/:threadId/state',
  validateRequest({ params: threadParamsSchema, body: threadStateBodySchema }),
  asyncHandler(messagingController.changeThreadState),
);
router.post(
  '/threads/:threadId/mute',
  validateRequest({ params: threadParamsSchema, body: muteThreadBodySchema }),
  asyncHandler(messagingController.muteConversation),
);
router.post(
  '/threads/:threadId/escalate',
  validateRequest({ params: threadParamsSchema, body: escalateThreadBodySchema }),
  asyncHandler(messagingController.escalateThread),
);
router.post(
  '/threads/:threadId/assign-support',
  validateRequest({ params: threadParamsSchema, body: assignSupportBodySchema }),
  asyncHandler(messagingController.assignSupport),
);
router.post(
  '/threads/:threadId/support-status',
  validateRequest({ params: threadParamsSchema, body: supportStatusBodySchema }),
  asyncHandler(messagingController.updateSupportStatus),
);
router.post(
  '/threads/retention/enforce',
  validateRequest({ body: enforceRetentionBodySchema }),
  asyncHandler(messagingController.enforceRetention),
);

router.post(
  '/threads/:threadId/settings',
  validateRequest({ params: threadParamsSchema, body: threadSettingsBodySchema }),
  asyncHandler(messagingController.updateThreadSettings),
);
router.post(
  '/threads/:threadId/participants',
  validateRequest({ params: threadParamsSchema, body: addParticipantsBodySchema }),
  asyncHandler(messagingController.addParticipants),
);
router.delete(
  '/threads/:threadId/participants/:participantId',
  validateRequest({ params: participantParamsSchema }),
  asyncHandler(messagingController.removeParticipant),
);

router.get('/inbox/workspace', asyncHandler(inboxController.workspace));
router.put('/inbox/preferences', asyncHandler(inboxController.savePreferences));
router.post('/inbox/saved-replies', asyncHandler(inboxController.createReply));
router.patch('/inbox/saved-replies/:replyId', asyncHandler(inboxController.updateReply));
router.delete('/inbox/saved-replies/:replyId', asyncHandler(inboxController.removeReply));
router.post('/inbox/routing-rules', asyncHandler(inboxController.createRule));
router.patch('/inbox/routing-rules/:ruleId', asyncHandler(inboxController.updateRule));
router.delete('/inbox/routing-rules/:ruleId', asyncHandler(inboxController.removeRule));

export default router;
