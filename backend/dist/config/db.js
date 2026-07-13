"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
async function connectDB() {
    try {
        await mongoose_1.default.connect(env_1.env.MONGO_URI);
        logger_1.logger.info('MongoDB connected');
    }
    catch (error) {
        logger_1.logger.error('MongoDB connection failed', { error });
        process.exit(1);
    }
    mongoose_1.default.connection.on('disconnected', () => {
        logger_1.logger.warn('MongoDB disconnected');
    });
}
