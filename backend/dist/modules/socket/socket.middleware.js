"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = socketAuthMiddleware;
const jwt_1 = require("../../utils/jwt");
function socketAuthMiddleware(socket, next) {
    const token = socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization?.startsWith('Bearer ')
            ? socket.handshake.headers.authorization.split(' ')[1]
            : undefined);
    if (!token) {
        return next(new Error('Authentication token missing'));
    }
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        socket.data.user = payload;
        next();
    }
    catch {
        next(new Error('Invalid or expired token'));
    }
}
