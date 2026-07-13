import { Router } from 'express';
import * as summaryController from './summary.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { generateSummarySchema, summaryMeetingParamSchema } from './summary.validation';

const router = Router();

router.use(authMiddleware);

router.post('/:meetingId/generate', validate(generateSummarySchema), summaryController.generateSummary);
router.get('/:meetingId', validate(summaryMeetingParamSchema), summaryController.getSummary);
router.delete('/:meetingId', validate(summaryMeetingParamSchema), summaryController.deleteSummary);

export default router;
