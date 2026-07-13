"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSummary = exports.getSummary = exports.generateSummary = void 0;
const summary_service_1 = require("./summary.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
const apiError_1 = require("../../utils/apiError");
const summaryService = new summary_service_1.SummaryService();
exports.generateSummary = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const summary = await summaryService.generateSummary(req.params.meetingId, req.user.userId, req.body);
    res.status(201).json(new apiResponse_1.ApiResponse('Meeting summary generated', summary));
});
exports.getSummary = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const summary = await summaryService.getSummary(req.params.meetingId, req.user.userId);
    res.status(200).json(new apiResponse_1.ApiResponse('Meeting summary fetched', summary));
});
exports.deleteSummary = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    await summaryService.deleteSummary(req.params.meetingId, req.user.userId);
    res.status(200).json(new apiResponse_1.ApiResponse('Meeting summary deleted'));
});
