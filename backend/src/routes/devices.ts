import { Router } from 'express';
import { registerDevice, removeDevice } from '../controllers/deviceController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/register', registerDevice);
router.delete('/:token', removeDevice);

export default router;
