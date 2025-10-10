import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(userController.listUsers));
router.get('/:id', asyncHandler(userController.getUserProfile));
router.put('/:id', asyncHandler(userController.updateProfile));

export default router;
