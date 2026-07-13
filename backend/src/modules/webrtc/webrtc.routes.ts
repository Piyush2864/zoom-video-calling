import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { getIceServersConfig } from './webrtc.controller';

const router = Router();

router.use(authMiddleware);
router.get('/ice-servers', getIceServersConfig);

export default router;
