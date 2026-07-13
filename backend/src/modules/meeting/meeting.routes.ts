import { Router } from 'express';
import * as meetingController from './meeting.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createInstantMeetingSchema,
  scheduleMeetingSchema,
  joinMeetingSchema,
  meetingIdParamSchema,
  waitingRoomActionSchema,
  participantActionParamSchema,
  setLockedSchema,
  setRecordingSchema,
  listMeetingsQuerySchema,
} from './meeting.validation';

const router = Router();

router.use(authMiddleware);

router.post('/instant', validate(createInstantMeetingSchema), meetingController.createInstantMeeting);
router.post('/schedule', validate(scheduleMeetingSchema), meetingController.scheduleMeeting);
router.get('/personal-room', meetingController.getPersonalRoom);
router.post('/join', validate(joinMeetingSchema), meetingController.joinMeeting);
router.get('/', validate(listMeetingsQuerySchema), meetingController.listMeetings);

router.get('/:id', validate(meetingIdParamSchema), meetingController.getMeetingById);
router.patch('/:id/start', validate(meetingIdParamSchema), meetingController.startMeeting);
router.patch('/:id/end', validate(meetingIdParamSchema), meetingController.endMeeting);
router.patch('/:id/leave', validate(meetingIdParamSchema), meetingController.leaveMeeting);
router.delete('/:id', validate(meetingIdParamSchema), meetingController.cancelMeeting);

router.patch(
  '/:id/waiting-room/:userId/admit',
  validate(waitingRoomActionSchema),
  meetingController.admitParticipant
);
router.patch(
  '/:id/waiting-room/:userId/deny',
  validate(waitingRoomActionSchema),
  meetingController.denyParticipant
);

router.patch(
  '/:id/participants/:userId/remove',
  validate(participantActionParamSchema),
  meetingController.removeParticipant
);
router.patch('/:id/lock', validate(setLockedSchema), meetingController.setLocked);
router.patch('/:id/recording', validate(setRecordingSchema), meetingController.setRecording);
router.patch(
  '/:id/co-host/:userId',
  validate(participantActionParamSchema),
  meetingController.assignCoHost
);
router.delete(
  '/:id/co-host/:userId',
  validate(participantActionParamSchema),
  meetingController.revokeCoHost
);

export default router;
