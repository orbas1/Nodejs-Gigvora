import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import buildAuthenticate, { requireRoles } from '../middleware/authenticate.js';
import groupController from '../controllers/groupController.js';

const authenticate = buildAuthenticate;

const router = Router();

// Community routes
router.get(
  '/discover',
  authenticate({ optional: true }),
  asyncHandler(groupController.discover),
);
router.get(
  '/',
  authenticate({ optional: true }),
  asyncHandler(groupController.index),
);
router.get(
  '/:groupId',
  authenticate({ optional: true }),
  asyncHandler(groupController.show),
);
router.post(
  '/:groupId/join',
  authenticate(),
  asyncHandler(groupController.join),
);
router.delete(
  '/:groupId/leave',
  authenticate(),
  asyncHandler(groupController.leave),
);
router.patch(
  '/:groupId/membership',
  authenticate(),
  asyncHandler(groupController.updateMembership),
);
router.post(
  '/:groupId/memberships/request',
  authenticate(),
  asyncHandler(groupController.requestMembership),
);

// Management routes
router.get(
  '/manage',
  authenticate(),
  requireRoles('admin', 'agency'),
  asyncHandler(groupController.listManaged),
);
router.post(
  '/',
  authenticate(),
  requireRoles('admin', 'agency'),
  asyncHandler(groupController.create),
);
router.get(
  '/manage/:groupId',
  authenticate(),
  requireRoles('admin', 'agency'),
  asyncHandler(groupController.getManaged),
);
router.put(
  '/manage/:groupId',
  authenticate(),
  requireRoles('admin', 'agency'),
  asyncHandler(groupController.update),
);
router.post(
  '/manage/:groupId/memberships',
  authenticate(),
  requireRoles('admin', 'agency'),
  asyncHandler(groupController.addMember),
);
router.patch(
  '/manage/:groupId/memberships/:membershipId',
  authenticate(),
  requireRoles('admin', 'agency'),
  asyncHandler(groupController.updateMember),
);
router.delete(
  '/manage/:groupId/memberships/:membershipId',
  authenticate(),
  requireRoles('admin', 'agency'),
  asyncHandler(groupController.removeMember),
);

export default router;
