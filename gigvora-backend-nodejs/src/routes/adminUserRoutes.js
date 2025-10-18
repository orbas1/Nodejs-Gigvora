import { Router } from 'express';

import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as controller from '../controllers/adminUserController.js';
import {
  adminUserListQuerySchema,
  adminUserCreateSchema,
  adminUserUpdateSchema,
  adminUserSecurityUpdateSchema,
  adminUserStatusUpdateSchema,
  adminUserRoleUpdateSchema,
  adminUserResetPasswordSchema,
  adminUserNoteCreateSchema,
  adminUserNotesQuerySchema,
} from '../validation/schemas/adminUserSchemas.js';

const router = Router();

router.get('/meta', asyncHandler(controller.metadata));
router.get('/', validateRequest({ query: adminUserListQuerySchema }), asyncHandler(controller.index));
router.post('/', validateRequest({ body: adminUserCreateSchema }), asyncHandler(controller.store));
router.get('/:id', asyncHandler(controller.show));
router.patch('/:id', validateRequest({ body: adminUserUpdateSchema }), asyncHandler(controller.patch));
router.patch(
  '/:id/security',
  validateRequest({ body: adminUserSecurityUpdateSchema }),
  asyncHandler(controller.patchSecurity),
);
router.patch(
  '/:id/status',
  validateRequest({ body: adminUserStatusUpdateSchema }),
  asyncHandler(controller.patchStatus),
);
router.put(
  '/:id/roles',
  validateRequest({ body: adminUserRoleUpdateSchema }),
  asyncHandler(controller.putRoles),
);
router.delete('/:id/roles/:role', asyncHandler(controller.destroyRole));
router.post(
  '/:id/reset-password',
  validateRequest({ body: adminUserResetPasswordSchema }),
  asyncHandler(controller.postResetPassword),
);
router.post(
  '/:id/notes',
  validateRequest({ body: adminUserNoteCreateSchema }),
  asyncHandler(controller.postNote),
);
router.get(
  '/:id/notes',
  validateRequest({ query: adminUserNotesQuerySchema }),
  asyncHandler(controller.listUserNotes),
);

export default router;

