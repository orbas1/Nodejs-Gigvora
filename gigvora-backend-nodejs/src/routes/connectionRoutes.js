import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import * as connectionController from '../controllers/connectionController.js';

const router = Router();
const CONNECTION_ROLES = [
  'user',
  'freelancer',
  'agency',
  'company',
  'headhunter',
  'mentor',
  'admin',
];

router.use(authenticateRequest());
router.use(requireRoles(...CONNECTION_ROLES));

router.get('/network', asyncHandler(connectionController.getNetwork));
router.post('/', asyncHandler(connectionController.createConnection));
router.post('/:connectionId/respond', asyncHandler(connectionController.respondToConnection));

export default router;
