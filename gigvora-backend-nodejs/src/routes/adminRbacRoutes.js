import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  auditLogQuerySchema,
  simulateAccessBodySchema,
} from '../validation/schemas/rbacSchemas.js';
import * as rbacPolicyController from '../controllers/rbacPolicyController.js';
import { authenticateRequest } from '../middleware/authentication.js';
import { requirePermission } from '../middleware/authorization.js';

const router = Router();

router.use(authenticateRequest());

router.get('/matrix', requirePermission('rbac:matrix:view'), asyncHandler(rbacPolicyController.matrix));

router.get(
  '/audit-events',
  requirePermission('rbac:matrix:audit'),
  validateRequest({ query: auditLogQuerySchema }),
  asyncHandler(rbacPolicyController.auditLog),
);

router.post(
  '/simulate',
  requirePermission('rbac:matrix:simulate'),
  validateRequest({ body: simulateAccessBodySchema }),
  asyncHandler(rbacPolicyController.simulate),
);

export default router;
