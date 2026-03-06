import { Router } from 'express';
import multer from 'multer';
import { createSession, confirmSession } from './controllers/CheckoutController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/checkout/session', upload.array('photos', 5), createSession);
router.post('/checkout/confirm', confirmSession);

export default router;
