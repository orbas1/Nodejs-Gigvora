import { Router } from 'express';
import * as connectionController from '../controllers/connectionController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/network', asyncHandler(connectionController.getNetwork));
router.post('/', asyncHandler(connectionController.createConnection));
router.post('/:connectionId/respond', asyncHandler(connectionController.respondToConnection));

export default router;
