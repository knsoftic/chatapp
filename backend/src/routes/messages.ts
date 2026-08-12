import { Router } from 'express';
import { sendMessage, markDelivered, markRead, bulkMarkRead } from '../controllers/messageController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', sendMessage);
router.post('/bulk-read', bulkMarkRead);
router.post('/:id/delivered', markDelivered);
router.post('/:id/read', markRead);

export default router;
