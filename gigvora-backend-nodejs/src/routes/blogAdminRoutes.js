import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import blogAdminController from '../controllers/blogAdminController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);
router.use(requireRoles('admin'));

router.get('/posts', asyncHandler(blogAdminController.list));
router.get('/posts/:postId', asyncHandler(blogAdminController.retrieve));
router.post('/posts', asyncHandler(blogAdminController.create));
router.put('/posts/:postId', asyncHandler(blogAdminController.update));
router.delete('/posts/:postId', asyncHandler(blogAdminController.destroy));

router.get('/metrics/overview', asyncHandler(blogAdminController.metricsOverview));
router.get('/posts/:postId/metrics', asyncHandler(blogAdminController.metricsForPost));
router.put('/posts/:postId/metrics', asyncHandler(blogAdminController.updatePostMetrics));

router.get('/comments', asyncHandler(blogAdminController.comments));
router.get('/posts/:postId/comments', asyncHandler(blogAdminController.comments));
router.post('/posts/:postId/comments', asyncHandler(blogAdminController.createComment));
router.put('/comments/:commentId', asyncHandler(blogAdminController.updateComment));
router.delete('/comments/:commentId', asyncHandler(blogAdminController.deleteComment));

router.get('/categories', asyncHandler(blogAdminController.categories));
router.post('/categories', asyncHandler(blogAdminController.createCategory));
router.put('/categories/:categoryId', asyncHandler(blogAdminController.updateCategory));
router.delete('/categories/:categoryId', asyncHandler(blogAdminController.deleteCategory));

router.get('/tags', asyncHandler(blogAdminController.tags));
router.post('/tags', asyncHandler(blogAdminController.createTag));
router.put('/tags/:tagId', asyncHandler(blogAdminController.updateTag));
router.delete('/tags/:tagId', asyncHandler(blogAdminController.deleteTag));

router.post('/media', asyncHandler(blogAdminController.createMedia));

export default router;
