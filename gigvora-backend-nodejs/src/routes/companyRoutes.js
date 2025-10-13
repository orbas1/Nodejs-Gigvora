import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import companyController from '../controllers/companyController.js';

const router = Router();

router.get('/dashboard', asyncHandler(companyController.dashboard));

export default router;

