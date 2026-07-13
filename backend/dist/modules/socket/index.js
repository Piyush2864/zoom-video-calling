"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSocketHandlers = registerSocketHandlers;
const socket_middleware_1 = require("./socket.middleware");
const meeting_socket_1 = require("./meeting.socket");
const webrtc_socket_1 = require("./webrtc.socket");
const chat_socket_1 = require("./chat.socket");
const host_controls_socket_1 = require("./host-controls.socket");
const logger_1 = require("../../utils/logger");
function registerSocketHandlers(io) {
    io.use(socket_middleware_1.socketAuthMiddleware);
    io.on('connection', (socket) => {
        logger_1.logger.info(`Socket connected: ${socket.id} (user ${socket.data.user.userId})`);
        (0, meeting_socket_1.registerMeetingHandlers)(io, socket);
        (0, webrtc_socket_1.registerWebRTCHandlers)(io, socket);
        (0, chat_socket_1.registerChatHandlers)(io, socket);
        (0, host_controls_socket_1.registerHostControlHandlers)(io, socket);
        socket.on('disconnect', (reason) => {
            logger_1.logger.info(`Socket disconnected: ${socket.id} (${reason})`);
        });
    });
}
