import { Router } from 'express';
import * as controller from '../controllers/adminVolunteeringController.js';
import asyncHandler from '../utils/asyncHandler.js';
import validateRequest from '../middleware/validateRequest.js';
import { requireAdmin } from '../middleware/authenticate.js';
import {
  volunteeringInsightsQuerySchema,
  programQuerySchema,
  programBodySchema,
  roleQuerySchema,
  roleBodySchema,
  shiftQuerySchema,
  shiftBodySchema,
  assignmentBodySchema,
} from '../validation/schemas/adminVolunteeringSchemas.js';

const router = Router();

router.use(requireAdmin);

router.get('/insights', validateRequest({ query: volunteeringInsightsQuerySchema }), asyncHandler(controller.insights));

router.get('/programs', validateRequest({ query: programQuerySchema }), asyncHandler(controller.listPrograms));
router.post('/programs', validateRequest({ body: programBodySchema }), asyncHandler(controller.createProgram));
router.get('/programs/:programId', asyncHandler(controller.getProgram));
router.put('/programs/:programId', validateRequest({ body: programBodySchema }), asyncHandler(controller.updateProgram));
router.delete('/programs/:programId', asyncHandler(controller.deleteProgram));

router.get('/roles', validateRequest({ query: roleQuerySchema }), asyncHandler(controller.listRoles));
router.post('/roles', validateRequest({ body: roleBodySchema }), asyncHandler(controller.createRole));
router.get('/roles/:roleId', asyncHandler(controller.getRole));
router.put('/roles/:roleId', validateRequest({ body: roleBodySchema }), asyncHandler(controller.updateRole));
router.delete('/roles/:roleId', asyncHandler(controller.deleteRole));
router.post('/roles/:roleId/publish', asyncHandler(controller.publishRole));

router.get(
  '/roles/:roleId/shifts',
  validateRequest({ query: shiftQuerySchema }),
  asyncHandler(controller.listShifts),
);
router.post(
  '/roles/:roleId/shifts',
  validateRequest({ body: shiftBodySchema }),
  asyncHandler(controller.createShift),
);
router.put(
  '/roles/:roleId/shifts/:shiftId',
  validateRequest({ body: shiftBodySchema }),
  asyncHandler(controller.updateShift),
);
router.delete('/roles/:roleId/shifts/:shiftId', asyncHandler(controller.deleteShift));

router.get(
  '/roles/:roleId/shifts/:shiftId/assignments',
  asyncHandler(controller.listAssignments),
);
router.post(
  '/roles/:roleId/shifts/:shiftId/assignments',
  validateRequest({ body: assignmentBodySchema }),
  asyncHandler(controller.createAssignment),
);
router.put(
  '/roles/:roleId/shifts/:shiftId/assignments/:assignmentId',
  validateRequest({ body: assignmentBodySchema }),
  asyncHandler(controller.updateAssignment),
);
router.delete(
  '/roles/:roleId/shifts/:shiftId/assignments/:assignmentId',
  asyncHandler(controller.deleteAssignment),
);

export default router;
