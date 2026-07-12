import { Response } from 'express';
import { MeetingService } from './meeting.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';
import { AuthRequest } from '../../middlewares/auth.middleware';

const meetingService = new MeetingService();

export const createInstantMeeting = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const meeting = await meetingService.createInstantMeeting(req.user.userId, req.body);
  res.status(201).json(new ApiResponse('Instant meeting started', meeting));
});

export const scheduleMeeting = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const meeting = await meetingService.scheduleMeeting(req.user.userId, req.body);
  res.status(201).json(new ApiResponse('Meeting scheduled', meeting));
});

export const getPersonalRoom = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const meeting = await meetingService.getOrCreatePersonalRoom(req.user.userId);
  res.status(200).json(new ApiResponse('Personal meeting room', meeting));
});

export const startMeeting = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const meeting = await meetingService.startMeeting(req.params.id, req.user.userId);
  res.status(200).json(new ApiResponse('Meeting started', meeting));
});

export const joinMeeting = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { meetingCode, password } = req.body;
  const result = await meetingService.joinMeeting(req.user.userId, meetingCode, password);

  if (!result.admitted) {
    return res
      .status(200)
      .json(new ApiResponse("You're in the waiting room. The host will admit you shortly.", result));
  }

  res.status(200).json(new ApiResponse('Joined meeting', result));
});

export const admitParticipant = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const meeting = await meetingService.admitParticipant(req.params.id, req.user.userId, req.params.userId);
  res.status(200).json(new ApiResponse('Participant admitted', meeting));
});

export const denyParticipant = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const meeting = await meetingService.denyParticipant(req.params.id, req.user.userId, req.params.userId);
  res.status(200).json(new ApiResponse('Participant denied', meeting));
});

export const leaveMeeting = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await meetingService.leaveMeeting(req.params.id, req.user.userId);
  res.status(200).json(new ApiResponse('Left meeting'));
});

export const endMeeting = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const meeting = await meetingService.endMeeting(req.params.id, req.user.userId);
  res.status(200).json(new ApiResponse('Meeting ended', meeting));
});

export const cancelMeeting = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await meetingService.cancelMeeting(req.params.id, req.user.userId);
  res.status(200).json(new ApiResponse('Meeting cancelled'));
});

export const getMeetingById = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const meeting = await meetingService.getMeetingById(req.params.id, req.user.userId);
  res.status(200).json(new ApiResponse('Meeting fetched', meeting));
});

export const listMeetings = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const scope = req.query.scope === 'history' ? 'history' : 'upcoming';
  const meetings =
    scope === 'history'
      ? await meetingService.listHistory(req.user.userId)
      : await meetingService.listUpcoming(req.user.userId);
  res.status(200).json(new ApiResponse(`${scope} meetings fetched`, meetings));
});
