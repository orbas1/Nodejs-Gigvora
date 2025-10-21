import { Router } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';
import * as userGroupController from '../controllers/userGroupController.js';
import validateRequest from '../middleware/validateRequest.js';

const router = Router({ mergeParams: true });

const groupParamsSchema = z
  .object({
    groupId: z.coerce.number().int().positive({ message: 'groupId must be a positive integer.' }),
  })
  .strip();

const inviteParamsSchema = groupParamsSchema
  .extend({
    inviteId: z.coerce.number().int().positive({ message: 'inviteId must be a positive integer.' }),
  })
  .strip();

const postParamsSchema = groupParamsSchema
  .extend({
    postId: z.coerce.number().int().positive({ message: 'postId must be a positive integer.' }),
  })
  .strip();

router.get('/', asyncHandler(userGroupController.index));
router.post('/', asyncHandler(userGroupController.store));
router.put('/:groupId', validateRequest({ params: groupParamsSchema }), asyncHandler(userGroupController.update));

router.get('/:groupId/invites', validateRequest({ params: groupParamsSchema }), asyncHandler(userGroupController.listInvites));
router.post('/:groupId/invites', validateRequest({ params: groupParamsSchema }), asyncHandler(userGroupController.createInvite));
router.delete(
  '/:groupId/invites/:inviteId',
  validateRequest({ params: inviteParamsSchema }),
  asyncHandler(userGroupController.removeInvite),
);

router.get('/:groupId/posts', validateRequest({ params: groupParamsSchema }), asyncHandler(userGroupController.listPosts));
router.post('/:groupId/posts', validateRequest({ params: groupParamsSchema }), asyncHandler(userGroupController.createPost));
router.patch(
  '/:groupId/posts/:postId',
  validateRequest({ params: postParamsSchema }),
  asyncHandler(userGroupController.updatePost),
);
router.delete(
  '/:groupId/posts/:postId',
  validateRequest({ params: postParamsSchema }),
  asyncHandler(userGroupController.deletePost),
);

export default router;
