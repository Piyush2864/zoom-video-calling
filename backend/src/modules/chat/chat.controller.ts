import { Response } from 'express';
import { ChatService } from './chat.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';
import { AuthRequest } from '../../middlewares/auth.middleware';

const chatService = new ChatService();

export const uploadAttachment = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  if (!req.file) throw ApiError.badRequest('No file provided');

  const attachment = await chatService.uploadAttachment(
    req.params.meetingId,
    req.user.userId,
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    req.file.size
  );

  res.status(201).json(new ApiResponse('File uploaded', attachment));
});

export const getHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { before, limit } = req.query as { before?: string; limit?: string };
  const messages = await chatService.getHistory(
    req.params.meetingId,
    req.user.userId,
    before,
    limit ? Number(limit) : undefined
  );
  res.status(200).json(new ApiResponse('Chat history fetched', messages));
});

export const searchMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { q } = req.query as { q: string };
  const messages = await chatService.searchMessages(req.params.meetingId, req.user.userId, q);
  res.status(200).json(new ApiResponse('Search results', messages));
});
