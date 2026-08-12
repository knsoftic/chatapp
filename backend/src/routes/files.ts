import { Router } from 'express';
import multer from 'multer';
import { uploadVoice, uploadDocument } from '../controllers/fileController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Use memory storage — fileController writes to disk
const memUpload = multer({ storage: multer.memoryStorage() });

router.post('/voice', memUpload.single('file'), uploadVoice);
router.post('/document', memUpload.single('file'), uploadDocument);

export default router;
