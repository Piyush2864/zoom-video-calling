"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeCoHost = exports.assignCoHost = exports.setRecording = exports.setLocked = exports.removeParticipant = exports.listMeetings = exports.getMeetingById = exports.cancelMeeting = exports.endMeeting = exports.leaveMeeting = exports.denyParticipant = exports.admitParticipant = exports.joinMeeting = exports.startMeeting = exports.getPersonalRoom = exports.scheduleMeeting = exports.createInstantMeeting = void 0;
const meeting_service_1 = require("./meeting.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
const apiError_1 = require("../../utils/apiError");
const meetingService = new meeting_service_1.MeetingService();
exports.createInstantMeeting = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const meeting = await meetingService.createInstantMeeting(req.user.userId, req.body);
    res.status(201).json(new apiResponse_1.ApiResponse('Instant meeting started', meeting));
});
exports.scheduleMeeting = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const meeting = await meetingService.scheduleMeeting(req.user.userId, req.body);
    res.status(201).json(new apiResponse_1.ApiResponse('Meeting scheduled', meeting));
});
exports.getPersonalRoom = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const meeting = await meetingService.getOrCreatePersonalRoom(req.user.userId);
    res.status(200).json(new apiResponse_1.ApiResponse('Personal meeting room', meeting));
});
exports.startMeeting = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const meeting = await meetingService.startMeeting(req.params.id, req.user.userId);
    res.status(200).json(new apiResponse_1.ApiResponse('Meeting started', meeting));
});
exports.joinMeeting = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const { meetingCode, password } = req.body;
    const result = await meetingService.joinMeeting(req.user.userId, meetingCode, password);
    if (!result.admitted) {
        return res
            .status(200)
            .json(new apiResponse_1.ApiResponse("You're in the waiting room. The host will admit you shortly.", result));
    }
    res.status(200).json(new apiResponse_1.ApiResponse('Joined meeting', result));
});
exports.admitParticipant = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const meeting = await meetingService.admitParticipant(req.params.id, req.user.userId, req.params.userId);
    res.status(200).json(new apiResponse_1.ApiResponse('Participant admitted', meeting));
});
exports.denyParticipant = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const meeting = await meetingService.denyParticipant(req.params.id, req.user.userId, req.params.userId);
    res.status(200).json(new apiResponse_1.ApiResponse('Participant denied', meeting));
});
exports.leaveMeeting = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    await meetingService.leaveMeeting(req.params.id, req.user.userId);
    res.status(200).json(new apiResponse_1.ApiResponse('Left meeting'));
});
exports.endMeeting = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const meeting = await meetingService.endMeeting(req.params.id, req.user.userId);
    res.status(200).json(new apiResponse_1.ApiResponse('Meeting ended', meeting));
});
exports.cancelMeeting = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    await meetingService.cancelMeeting(req.params.id, req.user.userId);
    res.status(200).json(new apiResponse_1.ApiResponse('Meeting cancelled'));
});
exports.getMeetingById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const meeting = await meetingService.getMeetingById(req.params.id, req.user.userId);
    res.status(200).json(new apiResponse_1.ApiResponse('Meeting fetched', meeting));
});
exports.listMeetings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const scope = req.query.scope === 'history' ? 'history' : 'upcoming';
    const meetings = scope === 'history'
        ? await meetingService.listHistory(req.user.userId)
        : await meetingService.listUpcoming(req.user.userId);
    res.status(200).json(new apiResponse_1.ApiResponse(`${scope} meetings fetched`, meetings));
});
exports.removeParticipant = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const meeting = await meetingService.removeParticipant(req.params.id, req.user.userId, req.params.userId);
    res.status(200).json(new apiResponse_1.ApiResponse('Participant removed', meeting));
});
exports.setLocked = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const meeting = await meetingService.setLocked(req.params.id, req.user.userId, req.body.locked);
    res
        .status(200)
        .json(new apiResponse_1.ApiResponse(req.body.locked ? 'Meeting locked' : 'Meeting unlocked', meeting));
});
exports.setRecording = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const meeting = await meetingService.setRecording(req.params.id, req.user.userId, req.body.recording);
    res
        .status(200)
        .json(new apiResponse_1.ApiResponse(req.body.recording ? 'Recording started' : 'Recording stopped', meeting));
});
exports.assignCoHost = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const meeting = await meetingService.assignCoHost(req.params.id, req.user.userId, req.params.userId);
    res.status(200).json(new apiResponse_1.ApiResponse('Co-host assigned', meeting));
});
exports.revokeCoHost = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const meeting = await meetingService.revokeCoHost(req.params.id, req.user.userId, req.params.userId);
    res.status(200).json(new apiResponse_1.ApiResponse('Co-host revoked', meeting));
});
