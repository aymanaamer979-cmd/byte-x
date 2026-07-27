import { Router } from 'express';
import * as authController from '../controllers/authController';
import { ensureDb } from '../middleware/authMiddleware';

const router = Router();

router.post('/sync', ensureDb, authController.syncUser);

export default router;
