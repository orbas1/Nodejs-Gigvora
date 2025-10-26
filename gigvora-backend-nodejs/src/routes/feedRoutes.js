import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import * as feedController from '../controllers/feedController.js';

const router = Router();
const FEED_ROLES = ['user', 'freelancer', 'agency', 'company', 'mentor', 'admin'];

router.use(authenticateRequest({ optional: true }));

router.get('/', asyncHandler(feedController.listFeed));
router.post('/', authenticateRequest(), requireRoles(...FEED_ROLES), asyncHandler(feedController.createPost));
router.patch(
  '/:postId',
  authenticateRequest(),
  requireRoles(...FEED_ROLES),
  asyncHandler(feedController.updatePost),
);
router.delete(
  '/:postId',
  authenticateRequest(),
  requireRoles(...FEED_ROLES),
  asyncHandler(feedController.deletePost),
);
router.get('/:postId/comments', asyncHandler(feedController.listComments));
router.post(
  '/:postId/comments',
  authenticateRequest(),
  asyncHandler(feedController.createComment),
);
router.post(
  '/:postId/comments/:commentId/replies',
  authenticateRequest(),
  asyncHandler(feedController.createReply),
);
router.post(
  '/:postId/shares',
  authenticateRequest(),
  asyncHandler(feedController.sharePost),
);
router.post(
  '/:postId/reactions',
  authenticateRequest(),
  asyncHandler(feedController.toggleReaction),
);

export default router;
