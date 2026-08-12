import { Router } from 'express';
import { getMe, updateMe, searchUser, getUserById, deleteAccount, syncContacts } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { searchRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authMiddleware);

router.get('/me', getMe);
router.put('/me', updateMe);
router.delete('/me', deleteAccount);
router.get('/search', searchRateLimiter, searchUser);
router.post('/sync-contacts', syncContacts);
router.get('/:id', getUserById);

export default router;
