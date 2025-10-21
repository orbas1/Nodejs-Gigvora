import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as userPageController from '../controllers/userPageController.js';
import {
  userPageParamsSchema,
  userPageDetailParamsSchema,
  userPageMembershipParamsSchema,
  userPageInviteParamsSchema,
  userPagePostParamsSchema,
  userPageMembershipQuerySchema,
  userPageManagedQuerySchema,
  userPagePostsQuerySchema,
  userPageCreateSchema,
  userPageUpdateSchema,
  userPageMembershipUpdateSchema,
  userPageInviteCreateSchema,
  userPagePostCreateSchema,
  userPagePostUpdateSchema,
} from '../validation/schemas/userPageSchemas.js';

const router = Router({ mergeParams: true });

router.get(
  '/',
  validateRequest({ params: userPageParamsSchema, query: userPageMembershipQuerySchema }),
  asyncHandler(userPageController.index),
);
router.get(
  '/managed',
  validateRequest({ params: userPageParamsSchema, query: userPageManagedQuerySchema }),
  asyncHandler(userPageController.managed),
);
router.post(
  '/',
  validateRequest({ params: userPageParamsSchema, body: userPageCreateSchema }),
  asyncHandler(userPageController.store),
);
router.put(
  '/:pageId',
  validateRequest({ params: userPageDetailParamsSchema, body: userPageUpdateSchema }),
  asyncHandler(userPageController.update),
);

router.get(
  '/:pageId/memberships',
  validateRequest({ params: userPageDetailParamsSchema }),
  asyncHandler(userPageController.memberships),
);
router.patch(
  '/:pageId/memberships/:membershipId',
  validateRequest({ params: userPageMembershipParamsSchema, body: userPageMembershipUpdateSchema }),
  asyncHandler(userPageController.updateMembership),
);

router.get(
  '/:pageId/invites',
  validateRequest({ params: userPageDetailParamsSchema }),
  asyncHandler(userPageController.invites),
);
router.post(
  '/:pageId/invites',
  validateRequest({ params: userPageDetailParamsSchema, body: userPageInviteCreateSchema }),
  asyncHandler(userPageController.createInvite),
);
router.delete(
  '/:pageId/invites/:inviteId',
  validateRequest({ params: userPageInviteParamsSchema }),
  asyncHandler(userPageController.removeInvite),
);

router.get(
  '/:pageId/posts',
  validateRequest({ params: userPageDetailParamsSchema, query: userPagePostsQuerySchema }),
  asyncHandler(userPageController.posts),
);
router.post(
  '/:pageId/posts',
  validateRequest({ params: userPageDetailParamsSchema, body: userPagePostCreateSchema }),
  asyncHandler(userPageController.createPost),
);
router.patch(
  '/:pageId/posts/:postId',
  validateRequest({ params: userPagePostParamsSchema, body: userPagePostUpdateSchema }),
  asyncHandler(userPageController.updatePost),
);
router.delete(
  '/:pageId/posts/:postId',
  validateRequest({ params: userPagePostParamsSchema }),
  asyncHandler(userPageController.deletePost),
);

export default router;
