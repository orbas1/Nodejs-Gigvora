import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import companyController from '../controllers/companyController.js';
import companyProfileController from '../controllers/companyProfileController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate({ roles: ['company', 'company_admin', 'admin'] }));

router.get('/dashboard', asyncHandler(companyController.dashboard));

router.get('/profile/workspace', asyncHandler(companyProfileController.getWorkspace));
router.put('/profile', asyncHandler(companyProfileController.updateProfile));
router.patch('/profile/avatar', asyncHandler(companyProfileController.updateAvatar));

router.get('/profile/followers', asyncHandler(companyProfileController.listFollowers));
router.post('/profile/followers', asyncHandler(companyProfileController.addFollower));
router.patch('/profile/followers/:followerId', asyncHandler(companyProfileController.updateFollower));
router.delete('/profile/followers/:followerId', asyncHandler(companyProfileController.removeFollower));

router.get('/profile/connections', asyncHandler(companyProfileController.listConnections));
router.post('/profile/connections', asyncHandler(companyProfileController.createConnection));
router.patch('/profile/connections/:connectionId', asyncHandler(companyProfileController.updateConnection));
router.delete('/profile/connections/:connectionId', asyncHandler(companyProfileController.removeConnection));

export default router;

