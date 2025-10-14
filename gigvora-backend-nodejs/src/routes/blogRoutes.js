import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import blogController from '../controllers/blogController.js';

const router = Router();

router.get('/posts', asyncHandler(blogController.index));
router.get('/posts/:slug', asyncHandler(blogController.show));
router.get('/categories', asyncHandler(blogController.categories));
router.get('/tags', asyncHandler(blogController.tags));

export default router;
