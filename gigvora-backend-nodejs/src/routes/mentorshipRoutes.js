import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import mentorshipController from '../controllers/mentorshipController.js';

const router = Router();

router.get('/dashboard', asyncHandler(mentorshipController.dashboard));
router.post('/availability', asyncHandler(mentorshipController.saveAvailability));
router.post('/packages', asyncHandler(mentorshipController.savePackages));
router.post('/profile', asyncHandler(mentorshipController.saveProfile));

export default router;
