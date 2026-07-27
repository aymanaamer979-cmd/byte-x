import { Router } from 'express';
import * as authController from '../controllers/authController';
import { ensureDb, authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/sync', ensureDb, authMiddleware, authController.syncUser);

export default router;
