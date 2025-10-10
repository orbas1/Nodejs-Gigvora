import { Router } from 'express';
import * as feedController from '../controllers/feedController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(feedController.listFeed));
router.post('/', asyncHandler(feedController.createPost));

export default router;
