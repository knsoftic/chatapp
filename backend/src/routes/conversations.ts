import { Router } from 'express';
import {
  listConversations,
  createOrGetConversation,
  getConversation,
} from '../controllers/conversationController';
import { getMessages } from '../controllers/messageController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', listConversations);
router.post('/', createOrGetConversation);
router.get('/:id', getConversation);
router.get('/:id/messages', getMessages);

export default router;
