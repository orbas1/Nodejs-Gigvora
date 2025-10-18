import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import adminJobPostController from '../controllers/adminJobPostController.js';
import { requireAdmin } from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  adminJobPostArchiveSchema,
  adminJobPostCreateSchema,
  adminJobPostLifecycleSchema,
  adminJobPostListQuerySchema,
  adminJobPostUpdateSchema,
} from '../validation/schemas/adminJobPostSchemas.js';

const router = Router();

router.use(requireAdmin);

router.get(
  '/posts',
  validateRequest({ query: adminJobPostListQuerySchema }),
  asyncHandler(adminJobPostController.list),
);
router.get('/posts/:postId', asyncHandler(adminJobPostController.retrieve));
router.post(
  '/posts',
  validateRequest({ body: adminJobPostCreateSchema }),
  asyncHandler(adminJobPostController.create),
);
router.put(
  '/posts/:postId',
  validateRequest({ body: adminJobPostUpdateSchema }),
  asyncHandler(adminJobPostController.update),
);
router.patch(
  '/posts/:postId',
  validateRequest({ body: adminJobPostUpdateSchema }),
  asyncHandler(adminJobPostController.update),
);
router.post(
  '/posts/:postId/publish',
  validateRequest({ body: adminJobPostLifecycleSchema }),
  asyncHandler(adminJobPostController.publish),
);
router.post(
  '/posts/:postId/archive',
  validateRequest({ body: adminJobPostArchiveSchema }),
  asyncHandler(adminJobPostController.archive),
);
router.delete('/posts/:postId', asyncHandler(adminJobPostController.destroy));

export default router;
