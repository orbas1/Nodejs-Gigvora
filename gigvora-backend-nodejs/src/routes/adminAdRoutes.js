import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import * as adCouponController from '../controllers/adCouponController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(asyncHandler(authenticate));
router.use(requireRole('admin'));

router.get('/', asyncHandler(adCouponController.index));
router.get('/:couponId', asyncHandler(adCouponController.show));
router.post('/', asyncHandler(adCouponController.store));
router.put('/:couponId', asyncHandler(adCouponController.update));
router.patch('/:couponId', asyncHandler(adCouponController.update));

export default router;
