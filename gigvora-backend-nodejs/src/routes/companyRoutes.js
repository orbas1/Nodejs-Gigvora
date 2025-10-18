import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import companyController from '../controllers/companyController.js';
import companyPageController from '../controllers/companyPageController.js';
import { authenticate } from '../middleware/authentication.js';
import { requireMembership } from '../middleware/authorization.js';

const router = Router();

const companyMemberships = ['company', 'company_admin', 'workspace_admin'];

router.get('/dashboard', asyncHandler(companyController.dashboard));
router.put(
  '/dashboard/overview',
  authenticate(),
  requireMembership(companyMemberships, { allowAdmin: true }),
  asyncHandler(companyController.updateDashboardOverview),
);

router.get(
  '/dashboard/pages',
  authenticate(),
  requireMembership(companyMemberships, { allowAdmin: true }),
  asyncHandler(companyPageController.index),
);

router.post(
  '/dashboard/pages',
  authenticate(),
  requireMembership(companyMemberships, { allowAdmin: true }),
  asyncHandler(companyPageController.create),
);

router.get(
  '/dashboard/pages/:pageId',
  authenticate(),
  requireMembership(companyMemberships, { allowAdmin: true }),
  asyncHandler(companyPageController.show),
);

router.put(
  '/dashboard/pages/:pageId',
  authenticate(),
  requireMembership(companyMemberships, { allowAdmin: true }),
  asyncHandler(companyPageController.update),
);

router.put(
  '/dashboard/pages/:pageId/sections',
  authenticate(),
  requireMembership(companyMemberships, { allowAdmin: true }),
  asyncHandler(companyPageController.updateSections),
);

router.put(
  '/dashboard/pages/:pageId/collaborators',
  authenticate(),
  requireMembership(companyMemberships, { allowAdmin: true }),
  asyncHandler(companyPageController.updateCollaborators),
);

router.post(
  '/dashboard/pages/:pageId/publish',
  authenticate(),
  requireMembership(companyMemberships, { allowAdmin: true }),
  asyncHandler(companyPageController.publish),
);

router.post(
  '/dashboard/pages/:pageId/archive',
  authenticate(),
  requireMembership(companyMemberships, { allowAdmin: true }),
  asyncHandler(companyPageController.archive),
);

router.delete(
  '/dashboard/pages/:pageId',
  authenticate(),
  requireMembership(companyMemberships, { allowAdmin: true }),
  asyncHandler(companyPageController.destroy),
);

export default router;

