import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  auditLogQuerySchema,
  simulateAccessBodySchema,
} from '../validation/schemas/rbacSchemas.js';
import * as rbacPolicyController from '../controllers/rbacPolicyController.js';
import { requireAdmin } from '../middleware/authenticate.js';

const router = Router();

router.use(requireAdmin);

router.get('/matrix', asyncHandler(rbacPolicyController.matrix));

router.get(
  '/audit-events',
  validateRequest({ query: auditLogQuerySchema }),
  asyncHandler(rbacPolicyController.auditLog),
);

router.post(
  '/simulate',
  validateRequest({ body: simulateAccessBodySchema }),
  asyncHandler(rbacPolicyController.simulate),
);

export default router;
