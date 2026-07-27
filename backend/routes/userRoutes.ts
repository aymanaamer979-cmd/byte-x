import { Router } from 'express';
import * as userController from '../controllers/userController';
import { ensureDb, authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(ensureDb);
// router.use(authMiddleware); // يمكن تفعيله لاحقاً عند جاهزية الفرونت اند لإرسال التوكن

router.get('/profile/:uid', userController.getProfile);
router.post('/update-profile', userController.updateProfile);
router.post('/presence', userController.updatePresence);
router.post('/deposit', userController.deposit);
router.post('/withdraw', userController.withdraw);
router.post('/invest', userController.invest);
router.get('/transactions/:uid', userController.getTransactions);
router.get('/chat/messages/:uid', userController.getChatMessages);
router.post('/chat/send', userController.sendChatMessage);

export default router;
