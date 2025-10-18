import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import * as userPageController from '../controllers/userPageController.js';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(userPageController.index));
router.get('/managed', asyncHandler(userPageController.managed));
router.post('/', asyncHandler(userPageController.store));
router.put('/:pageId', asyncHandler(userPageController.update));

router.get('/:pageId/memberships', asyncHandler(userPageController.memberships));
router.patch('/:pageId/memberships/:membershipId', asyncHandler(userPageController.updateMembership));

router.get('/:pageId/invites', asyncHandler(userPageController.invites));
router.post('/:pageId/invites', asyncHandler(userPageController.createInvite));
router.delete('/:pageId/invites/:inviteId', asyncHandler(userPageController.removeInvite));

router.get('/:pageId/posts', asyncHandler(userPageController.posts));
router.post('/:pageId/posts', asyncHandler(userPageController.createPost));
router.patch('/:pageId/posts/:postId', asyncHandler(userPageController.updatePost));
router.delete('/:pageId/posts/:postId', asyncHandler(userPageController.deletePost));

export default router;
