import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { statusSummary } from '../controllers/platformSignalsController.js';

const router = Router();

router.get('/summary', asyncHandler(statusSummary));

export default router;
