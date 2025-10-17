import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import agencyController from '../controllers/agencyController.js';
import agencyCalendarController from '../controllers/agencyCalendarController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';

const router = Router();

router.get(
  '/dashboard',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.dashboard),
);

router.get(
  '/calendar',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyCalendarController.index),
);

router.get(
  '/calendar/:eventId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyCalendarController.show),
);

router.post(
  '/calendar',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyCalendarController.store),
);

router.put(
  '/calendar/:eventId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyCalendarController.update),
);

router.delete(
  '/calendar/:eventId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyCalendarController.destroy),
);

export default router;

