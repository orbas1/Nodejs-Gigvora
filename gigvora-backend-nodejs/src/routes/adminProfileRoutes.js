import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import * as adminProfileController from '../controllers/adminProfileController.js';
import { requireAdmin } from '../middleware/authenticate.js';
import {
  adminProfileListQuerySchema,
  adminProfileCreateSchema,
  adminProfileUpdateSchema,
  adminProfileReferenceCreateSchema,
  adminProfileReferenceUpdateSchema,
  adminProfileNoteCreateSchema,
  adminProfileNoteUpdateSchema,
} from '../validation/schemas/adminProfileSchemas.js';

const router = Router();

router.use(requireAdmin);

router.get(
  '/',
  validateRequest({ query: adminProfileListQuerySchema }),
  asyncHandler(adminProfileController.listProfiles),
);

router.post(
  '/',
  validateRequest({ body: adminProfileCreateSchema }),
  asyncHandler(adminProfileController.createProfile),
);

router.get('/:profileId', asyncHandler(adminProfileController.getProfile));
router.put(
  '/:profileId',
  validateRequest({ body: adminProfileUpdateSchema }),
  asyncHandler(adminProfileController.updateProfile),
);

router.post(
  '/:profileId/references',
  validateRequest({ body: adminProfileReferenceCreateSchema }),
  asyncHandler(adminProfileController.createReference),
);
router.put(
  '/:profileId/references/:referenceId',
  validateRequest({ body: adminProfileReferenceUpdateSchema }),
  asyncHandler(adminProfileController.updateReference),
);
router.delete(
  '/:profileId/references/:referenceId',
  asyncHandler(adminProfileController.deleteReference),
);

router.post(
  '/:profileId/notes',
  validateRequest({ body: adminProfileNoteCreateSchema }),
  asyncHandler(adminProfileController.createNote),
);
router.put(
  '/:profileId/notes/:noteId',
  validateRequest({ body: adminProfileNoteUpdateSchema }),
  asyncHandler(adminProfileController.updateNote),
);
router.delete(
  '/:profileId/notes/:noteId',
  asyncHandler(adminProfileController.deleteNote),
);

export default router;
