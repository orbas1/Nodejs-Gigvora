import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import companyController from '../controllers/companyController.js';
import companyCalendarRoutes from './companyCalendarRoutes.js';

const router = Router();

router.get('/dashboard', asyncHandler(companyController.dashboard));

router.use('/calendar', companyCalendarRoutes);

export default router;

