import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import validateRequest from '../middleware/validateRequest.js';
import * as controller from '../controllers/volunteeringManagementController.js';
import {
  volunteeringDashboardQuerySchema,
  createVolunteeringPostBodySchema,
  updateVolunteeringPostBodySchema,
  volunteeringPostIdParamsSchema,
  createVolunteeringApplicationBodySchema,
  updateVolunteeringApplicationBodySchema,
  volunteeringApplicationIdParamsSchema,
  createVolunteeringResponseBodySchema,
  updateVolunteeringResponseBodySchema,
  volunteeringResponseIdParamsSchema,
  volunteeringInterviewBodySchema,
  volunteeringInterviewIdParamsSchema,
  volunteeringContractBodySchema,
  updateVolunteeringContractBodySchema,
  volunteeringContractIdParamsSchema,
  volunteeringSpendBodySchema,
  volunteeringSpendIdParamsSchema,
} from '../validation/schemas/volunteeringSchemas.js';

const router = Router();

router.use(authenticateRequest());
router.use(requireRoles(['company', 'admin']));

router.get(
  '/dashboard',
  validateRequest({ query: volunteeringDashboardQuerySchema }),
  asyncHandler(controller.dashboard),
);

router.post(
  '/posts',
  validateRequest({ body: createVolunteeringPostBodySchema }),
  asyncHandler(controller.createPost),
);

router.put(
  '/posts/:postId',
  validateRequest({ params: volunteeringPostIdParamsSchema, body: updateVolunteeringPostBodySchema }),
  asyncHandler(controller.updatePost),
);

router.delete(
  '/posts/:postId',
  validateRequest({ params: volunteeringPostIdParamsSchema, body: volunteeringDashboardQuerySchema }),
  asyncHandler(controller.removePost),
);

router.post(
  '/posts/:postId/applications',
  validateRequest({ params: volunteeringPostIdParamsSchema, body: createVolunteeringApplicationBodySchema }),
  asyncHandler(controller.createApplication),
);

router.put(
  '/applications/:applicationId',
  validateRequest({ params: volunteeringApplicationIdParamsSchema, body: updateVolunteeringApplicationBodySchema }),
  asyncHandler(controller.updateApplication),
);

router.delete(
  '/applications/:applicationId',
  validateRequest({ params: volunteeringApplicationIdParamsSchema, body: volunteeringDashboardQuerySchema }),
  asyncHandler(controller.removeApplication),
);

router.post(
  '/applications/:applicationId/responses',
  validateRequest({ params: volunteeringApplicationIdParamsSchema, body: createVolunteeringResponseBodySchema }),
  asyncHandler(controller.createResponse),
);

router.put(
  '/responses/:responseId',
  validateRequest({ params: volunteeringResponseIdParamsSchema, body: updateVolunteeringResponseBodySchema }),
  asyncHandler(controller.updateResponse),
);

router.delete(
  '/responses/:responseId',
  validateRequest({ params: volunteeringResponseIdParamsSchema, body: volunteeringDashboardQuerySchema }),
  asyncHandler(controller.removeResponse),
);

router.post(
  '/applications/:applicationId/interviews',
  validateRequest({ params: volunteeringApplicationIdParamsSchema, body: volunteeringInterviewBodySchema }),
  asyncHandler(controller.createInterview),
);

router.put(
  '/interviews/:interviewId',
  validateRequest({ params: volunteeringInterviewIdParamsSchema, body: volunteeringInterviewBodySchema }),
  asyncHandler(controller.updateInterview),
);

router.delete(
  '/interviews/:interviewId',
  validateRequest({ params: volunteeringInterviewIdParamsSchema, body: volunteeringDashboardQuerySchema }),
  asyncHandler(controller.removeInterview),
);

router.post(
  '/applications/:applicationId/contracts',
  validateRequest({ params: volunteeringApplicationIdParamsSchema, body: volunteeringContractBodySchema }),
  asyncHandler(controller.createContract),
);

router.put(
  '/contracts/:contractId',
  validateRequest({ params: volunteeringContractIdParamsSchema, body: updateVolunteeringContractBodySchema }),
  asyncHandler(controller.updateContract),
);

router.post(
  '/contracts/:contractId/spend',
  validateRequest({ params: volunteeringContractIdParamsSchema, body: volunteeringSpendBodySchema }),
  asyncHandler(controller.addSpend),
);

router.put(
  '/spend/:spendId',
  validateRequest({ params: volunteeringSpendIdParamsSchema, body: volunteeringSpendBodySchema }),
  asyncHandler(controller.updateSpend),
);

router.delete(
  '/spend/:spendId',
  validateRequest({ params: volunteeringSpendIdParamsSchema, body: volunteeringDashboardQuerySchema }),
  asyncHandler(controller.removeSpend),
);

export default router;
