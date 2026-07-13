"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchMessages = exports.getHistory = exports.uploadAttachment = void 0;
const chat_service_1 = require("./chat.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
const apiError_1 = require("../../utils/apiError");
const chatService = new chat_service_1.ChatService();
exports.uploadAttachment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    if (!req.file)
        throw apiError_1.ApiError.badRequest('No file provided');
    const attachment = await chatService.uploadAttachment(req.params.meetingId, req.user.userId, req.file.buffer, req.file.originalname, req.file.mimetype, req.file.size);
    res.status(201).json(new apiResponse_1.ApiResponse('File uploaded', attachment));
});
exports.getHistory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const { before, limit } = req.query;
    const messages = await chatService.getHistory(req.params.meetingId, req.user.userId, before, limit ? Number(limit) : undefined);
    res.status(200).json(new apiResponse_1.ApiResponse('Chat history fetched', messages));
});
exports.searchMessages = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const { q } = req.query;
    const messages = await chatService.searchMessages(req.params.meetingId, req.user.userId, q);
    res.status(200).json(new apiResponse_1.ApiResponse('Search results', messages));
});
