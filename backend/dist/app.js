"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./middlewares/error.middleware");
const rateLimiter_middleware_1 = require("./middlewares/rateLimiter.middleware");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("./modules/user/user.routes"));
const meeting_routes_1 = __importDefault(require("./modules/meeting/meeting.routes"));
const webrtc_routes_1 = __importDefault(require("./modules/webrtc/webrtc.routes"));
const chat_routes_1 = __importDefault(require("./modules/chat/chat.routes"));
const summary_routes_1 = __importDefault(require("./modules/summary/summary.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: env_1.env.CLIENT_URL,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use(rateLimiter_middleware_1.globalRateLimiter);
app.get('/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Server is healthy' });
});
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/users', user_routes_1.default);
app.use('/api/v1/meetings', meeting_routes_1.default);
app.use('/api/v1/webrtc', webrtc_routes_1.default);
app.use('/api/v1/chat', chat_routes_1.default);
app.use('/api/v1/summary', summary_routes_1.default);
app.use(error_middleware_1.notFoundMiddleware);
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
