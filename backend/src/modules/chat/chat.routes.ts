import { Router } from 'express';
import * as chatController from './chat.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploadChatFile } from '../../middlewares/uploadChatFile.middleware';
import { chatHistoryQuerySchema, chatSearchQuerySchema } from './chat.validation';

const router = Router();

router.use(authMiddleware);

router.post('/:meetingId/attachments', uploadChatFile, chatController.uploadAttachment);
router.get('/:meetingId/messages', validate(chatHistoryQuerySchema), chatController.getHistory);
router.get('/:meetingId/search', validate(chatSearchQuerySchema), chatController.searchMessages);

export default router;
