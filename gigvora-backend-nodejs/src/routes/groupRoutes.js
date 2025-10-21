import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import groupController from '../controllers/groupController.js';

const router = Router();
const GROUP_MANAGER_ROLES = ['admin', 'agency', 'company', 'workspace_admin'];
const requireManager = [authenticateRequest(), requireRoles(...GROUP_MANAGER_ROLES)];

router.get(
  '/discover',
  authenticateRequest({ optional: true }),
  asyncHandler(groupController.discover),
);

router.get('/', ...requireManager, asyncHandler(groupController.index));
router.post('/', ...requireManager, asyncHandler(groupController.create));

router.get('/:groupId', ...requireManager, asyncHandler(groupController.show));
router.put('/:groupId', ...requireManager, asyncHandler(groupController.update));

router.post(
  '/manage/:groupId/memberships',
  ...requireManager,
  asyncHandler(groupController.addMember),
);
router.patch(
  '/manage/:groupId/memberships/:membershipId',
  ...requireManager,
  asyncHandler(groupController.updateMember),
);
router.delete(
  '/manage/:groupId/memberships/:membershipId',
  ...requireManager,
  asyncHandler(groupController.removeMember),
);

router.post(
  '/:groupId/memberships',
  ...requireManager,
  asyncHandler(groupController.addMember),
);
router.patch(
  '/:groupId/memberships/:membershipId',
  ...requireManager,
  asyncHandler(groupController.updateMember),
);
router.delete(
  '/:groupId/memberships/:membershipId',
  ...requireManager,
  asyncHandler(groupController.removeMember),
);

router.post('/:groupId/join', authenticateRequest(), asyncHandler(groupController.join));
router.delete('/:groupId/leave', authenticateRequest(), asyncHandler(groupController.leave));
router.patch('/:groupId/membership', authenticateRequest(), asyncHandler(groupController.updateMembership));
router.post(
  '/:groupId/memberships/request',
  authenticateRequest(),
  asyncHandler(groupController.requestMembership),
);

export default router;
