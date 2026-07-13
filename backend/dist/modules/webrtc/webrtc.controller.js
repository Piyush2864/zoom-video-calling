"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIceServersConfig = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
const webrtc_1 = require("../../config/webrtc");
exports.getIceServersConfig = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.status(200).json(new apiResponse_1.ApiResponse('ICE server configuration', { iceServers: (0, webrtc_1.getIceServers)() }));
});
