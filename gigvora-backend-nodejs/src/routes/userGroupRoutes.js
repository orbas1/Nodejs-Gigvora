import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import * as userGroupController from '../controllers/userGroupController.js';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(userGroupController.index));
router.post('/', asyncHandler(userGroupController.store));
router.put('/:groupId', asyncHandler(userGroupController.update));

router.get('/:groupId/invites', asyncHandler(userGroupController.listInvites));
router.post('/:groupId/invites', asyncHandler(userGroupController.createInvite));
router.delete('/:groupId/invites/:inviteId', asyncHandler(userGroupController.removeInvite));

router.get('/:groupId/posts', asyncHandler(userGroupController.listPosts));
router.post('/:groupId/posts', asyncHandler(userGroupController.createPost));
router.patch('/:groupId/posts/:postId', asyncHandler(userGroupController.updatePost));
router.delete('/:groupId/posts/:postId', asyncHandler(userGroupController.deletePost));

export default router;
