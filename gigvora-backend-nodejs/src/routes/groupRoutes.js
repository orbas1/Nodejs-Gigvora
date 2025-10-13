import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import groupController from '../controllers/groupController.js';

const router = Router();

router.get('/', asyncHandler(groupController.index));
router.get('/:groupId', asyncHandler(groupController.show));
router.post('/:groupId/join', asyncHandler(groupController.join));
router.delete('/:groupId/leave', asyncHandler(groupController.leave));
router.patch('/:groupId/membership', asyncHandler(groupController.updateMembership));
import { authenticate, requireRoles } from '../middleware/authentication.js';

const router = Router();

router.get('/discover', authenticate({ optional: true }), asyncHandler(groupController.discover));

router.get(
  '/',
  authenticate(),
  requireRoles('admin', 'agency'),
  asyncHandler(groupController.index),
);

router.post(
  '/',
  authenticate(),
  requireRoles('admin', 'agency'),
  asyncHandler(groupController.create),
);

router.get(
  '/:groupId',
  authenticate(),
  requireRoles('admin', 'agency'),
  asyncHandler(groupController.show),
);

router.put(
  '/:groupId',
  authenticate(),
  requireRoles('admin', 'agency'),
  asyncHandler(groupController.update),
);

router.post(
  '/:groupId/memberships',
  authenticate(),
  requireRoles('admin', 'agency'),
  asyncHandler(groupController.addMember),
);

router.patch(
  '/:groupId/memberships/:membershipId',
  authenticate(),
  requireRoles('admin', 'agency'),
  asyncHandler(groupController.updateMember),
);

router.delete(
  '/:groupId/memberships/:membershipId',
  authenticate(),
  requireRoles('admin', 'agency'),
  asyncHandler(groupController.removeMember),
);

router.post(
  '/:groupId/memberships/request',
  authenticate(),
  asyncHandler(groupController.requestMembership),
);

export default router;
