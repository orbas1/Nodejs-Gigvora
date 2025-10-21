import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middleware/authenticate.js';
import { requireProjectManagementRole } from '../middleware/authorization.js';
import validateRequest from '../middleware/validateRequest.js';
import workManagementController from '../controllers/workManagementController.js';
import {
  workManagementProjectParamsSchema,
  workManagementSprintParamsSchema,
  workManagementTaskParamsSchema,
  workManagementRiskParamsSchema,
  workManagementChangeRequestParamsSchema,
  workManagementSprintCreateSchema,
  workManagementTaskCreateSchema,
  workManagementTaskUpdateSchema,
  workManagementTimeLogSchema,
  workManagementRiskCreateSchema,
  workManagementRiskUpdateSchema,
  workManagementChangeRequestCreateSchema,
  workManagementChangeRequestApprovalSchema,
} from '../validation/schemas/workManagementSchemas.js';

const router = Router({ mergeParams: true });

router.use(authenticate());
router.use(requireProjectManagementRole);

router.get(
  '/',
  validateRequest({ params: workManagementProjectParamsSchema }),
  asyncHandler(workManagementController.overview),
);
router.post(
  '/sprints',
  validateRequest({ params: workManagementProjectParamsSchema, body: workManagementSprintCreateSchema }),
  asyncHandler(workManagementController.storeSprint),
);
router.post(
  '/sprints/:sprintId/tasks',
  validateRequest({ params: workManagementSprintParamsSchema, body: workManagementTaskCreateSchema }),
  asyncHandler(workManagementController.storeTask),
);
router.post(
  '/tasks',
  validateRequest({ params: workManagementProjectParamsSchema, body: workManagementTaskCreateSchema }),
  asyncHandler(workManagementController.storeTask),
);
router.patch(
  '/tasks/:taskId',
  validateRequest({ params: workManagementTaskParamsSchema, body: workManagementTaskUpdateSchema }),
  asyncHandler(workManagementController.updateTask),
);
router.post(
  '/tasks/:taskId/time-entries',
  validateRequest({ params: workManagementTaskParamsSchema, body: workManagementTimeLogSchema }),
  asyncHandler(workManagementController.logTime),
);
router.post(
  '/risks',
  validateRequest({ params: workManagementProjectParamsSchema, body: workManagementRiskCreateSchema }),
  asyncHandler(workManagementController.storeRisk),
);
router.patch(
  '/risks/:riskId',
  validateRequest({ params: workManagementRiskParamsSchema, body: workManagementRiskUpdateSchema }),
  asyncHandler(workManagementController.modifyRisk),
);
router.post(
  '/change-requests',
  validateRequest({ params: workManagementProjectParamsSchema, body: workManagementChangeRequestCreateSchema }),
  asyncHandler(workManagementController.storeChangeRequest),
);
router.patch(
  '/change-requests/:changeRequestId/approve',
  validateRequest({
    params: workManagementChangeRequestParamsSchema,
    body: workManagementChangeRequestApprovalSchema,
  }),
  asyncHandler(workManagementController.approveChange),
);

export default router;
