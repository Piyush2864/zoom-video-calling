import { Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import { getIceServers } from '../../config/webrtc';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const getIceServersConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.status(200).json(new ApiResponse('ICE server configuration', { iceServers: getIceServers() }));
});
