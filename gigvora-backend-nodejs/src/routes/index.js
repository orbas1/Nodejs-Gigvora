import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import feedRoutes from './feedRoutes.js';
import searchRoutes from './searchRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/feed', feedRoutes);
router.use('/search', searchRoutes);

export default router;
