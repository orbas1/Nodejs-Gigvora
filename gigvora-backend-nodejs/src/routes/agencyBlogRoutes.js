import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import agencyBlogController from '../controllers/agencyBlogController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate());
router.use(requireRoles('agency', 'agency_admin', 'admin'));

router.get('/workspaces', asyncHandler(agencyBlogController.workspaces));

router.get('/posts', asyncHandler(agencyBlogController.list));
router.get('/posts/:postId', asyncHandler(agencyBlogController.retrieve));
router.post('/posts', asyncHandler(agencyBlogController.create));
router.put('/posts/:postId', asyncHandler(agencyBlogController.update));
router.delete('/posts/:postId', asyncHandler(agencyBlogController.destroy));

router.get('/categories', asyncHandler(agencyBlogController.categories));
router.post('/categories', asyncHandler(agencyBlogController.createCategory));
router.put('/categories/:categoryId', asyncHandler(agencyBlogController.updateCategory));
router.delete('/categories/:categoryId', asyncHandler(agencyBlogController.deleteCategory));

router.get('/tags', asyncHandler(agencyBlogController.tags));
router.post('/tags', asyncHandler(agencyBlogController.createTag));
router.put('/tags/:tagId', asyncHandler(agencyBlogController.updateTag));
router.delete('/tags/:tagId', asyncHandler(agencyBlogController.deleteTag));

router.post('/media', asyncHandler(agencyBlogController.createMedia));

export default router;
