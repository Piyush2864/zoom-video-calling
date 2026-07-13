import { Response } from 'express';
import { SummaryService } from './summary.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';
import { AuthRequest } from '../../middlewares/auth.middleware';

const summaryService = new SummaryService();

export const generateSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const summary = await summaryService.generateSummary(req.params.meetingId, req.user.userId, req.body);
  res.status(201).json(new ApiResponse('Meeting summary generated', summary));
});

export const getSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const summary = await summaryService.getSummary(req.params.meetingId, req.user.userId);
  res.status(200).json(new ApiResponse('Meeting summary fetched', summary));
});

export const deleteSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await summaryService.deleteSummary(req.params.meetingId, req.user.userId);
  res.status(200).json(new ApiResponse('Meeting summary deleted'));
});
