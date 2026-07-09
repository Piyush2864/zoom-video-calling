"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const socket_1 = require("./config/socket");
const logger_1 = require("./utils/logger");
async function bootstrap() {
    await (0, db_1.connectDB)();
    const server = http_1.default.createServer(app_1.default);
    (0, socket_1.initSocket)(server);
    server.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`Server running on port ${env_1.env.PORT} [${env_1.env.NODE_ENV}]`);
    });
    process.on('unhandledRejection', (reason) => {
        logger_1.logger.error('Unhandled promise rejection', { reason });
    });
}
bootstrap();
//# sourceMappingURL=server.js.map