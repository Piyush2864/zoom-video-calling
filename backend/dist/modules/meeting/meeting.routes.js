"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const meetingController = __importStar(require("./meeting.controller"));
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const meeting_validation_1 = require("./meeting.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware); // every meeting route requires an active session
router.post('/instant', (0, validate_middleware_1.validate)(meeting_validation_1.createInstantMeetingSchema), meetingController.createInstantMeeting);
router.post('/schedule', (0, validate_middleware_1.validate)(meeting_validation_1.scheduleMeetingSchema), meetingController.scheduleMeeting);
router.get('/personal-room', meetingController.getPersonalRoom);
router.post('/join', (0, validate_middleware_1.validate)(meeting_validation_1.joinMeetingSchema), meetingController.joinMeeting);
router.get('/', (0, validate_middleware_1.validate)(meeting_validation_1.listMeetingsQuerySchema), meetingController.listMeetings);
router.get('/:id', (0, validate_middleware_1.validate)(meeting_validation_1.meetingIdParamSchema), meetingController.getMeetingById);
router.patch('/:id/start', (0, validate_middleware_1.validate)(meeting_validation_1.meetingIdParamSchema), meetingController.startMeeting);
router.patch('/:id/end', (0, validate_middleware_1.validate)(meeting_validation_1.meetingIdParamSchema), meetingController.endMeeting);
router.patch('/:id/leave', (0, validate_middleware_1.validate)(meeting_validation_1.meetingIdParamSchema), meetingController.leaveMeeting);
router.delete('/:id', (0, validate_middleware_1.validate)(meeting_validation_1.meetingIdParamSchema), meetingController.cancelMeeting);
router.patch('/:id/waiting-room/:userId/admit', (0, validate_middleware_1.validate)(meeting_validation_1.waitingRoomActionSchema), meetingController.admitParticipant);
router.patch('/:id/waiting-room/:userId/deny', (0, validate_middleware_1.validate)(meeting_validation_1.waitingRoomActionSchema), meetingController.denyParticipant);
router.patch('/:id/participants/:userId/remove', (0, validate_middleware_1.validate)(meeting_validation_1.participantActionParamSchema), meetingController.removeParticipant);
router.patch('/:id/lock', (0, validate_middleware_1.validate)(meeting_validation_1.setLockedSchema), meetingController.setLocked);
router.patch('/:id/recording', (0, validate_middleware_1.validate)(meeting_validation_1.setRecordingSchema), meetingController.setRecording);
router.patch('/:id/co-host/:userId', (0, validate_middleware_1.validate)(meeting_validation_1.participantActionParamSchema), meetingController.assignCoHost);
router.delete('/:id/co-host/:userId', (0, validate_middleware_1.validate)(meeting_validation_1.participantActionParamSchema), meetingController.revokeCoHost);
exports.default = router;
