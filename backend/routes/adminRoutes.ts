import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { ensureDb, authMiddleware, adminOnly } from '../middleware/authMiddleware';

const router = Router();

router.use(ensureDb);
router.use(authMiddleware);
router.use(adminOnly);

router.get('/users', adminController.getAllUsers);
router.get('/stats', adminController.getUserStats);
router.post('/user/:uid/update-financials', adminController.updateFinancials);
router.put('/user/:uid/update-financials', adminController.updateFinancials);
router.get('/transactions', adminController.getAllTransactions);
router.put('/transaction/:id/status', adminController.updateTransactionStatus);

export default router;
