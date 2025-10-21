import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import adminMentoringController from '../controllers/adminMentoringController.js';
import validateRequest from '../middleware/validateRequest.js';
import { requireAdmin } from '../middleware/authenticate.js';
import {
  adminMentoringListQuerySchema,
  adminMentoringCreateBodySchema,
  adminMentoringUpdateBodySchema,
  adminMentoringNoteBodySchema,
  adminMentoringNoteUpdateBodySchema,
  adminMentoringActionCreateBodySchema,
  adminMentoringActionUpdateBodySchema,
} from '../validation/schemas/mentoringSchemas.js';

const router = Router();

router.use(requireAdmin);

router.get('/catalog', asyncHandler(adminMentoringController.catalog));

router.get(
  '/sessions',
  validateRequest({ query: adminMentoringListQuerySchema }),
  asyncHandler(adminMentoringController.index),
);

router.post(
  '/sessions',
  validateRequest({ body: adminMentoringCreateBodySchema }),
  asyncHandler(adminMentoringController.create),
);

router.get('/sessions/:sessionId', asyncHandler(adminMentoringController.show));

router.patch(
  '/sessions/:sessionId',
  validateRequest({ body: adminMentoringUpdateBodySchema }),
  asyncHandler(adminMentoringController.update),
);

router.post(
  '/sessions/:sessionId/notes',
  validateRequest({ body: adminMentoringNoteBodySchema }),
  asyncHandler(adminMentoringController.storeNote),
);

router.patch(
  '/sessions/:sessionId/notes/:noteId',
  validateRequest({ body: adminMentoringNoteUpdateBodySchema }),
  asyncHandler(adminMentoringController.updateNote),
);

router.delete(
  '/sessions/:sessionId/notes/:noteId',
  asyncHandler(adminMentoringController.destroyNote),
);

router.post(
  '/sessions/:sessionId/actions',
  validateRequest({ body: adminMentoringActionCreateBodySchema }),
  asyncHandler(adminMentoringController.storeAction),
);

router.patch(
  '/sessions/:sessionId/actions/:actionId',
  validateRequest({ body: adminMentoringActionUpdateBodySchema }),
  asyncHandler(adminMentoringController.updateAction),
);

router.delete(
  '/sessions/:sessionId/actions/:actionId',
  asyncHandler(adminMentoringController.destroyAction),
);

export default router;
