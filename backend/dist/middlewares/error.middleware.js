"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
exports.notFoundMiddleware = notFoundMiddleware;
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
function errorMiddleware(err, req, res, next) {
    let statusCode = 500;
    let message = 'Internal server error';
    let details;
    if (err instanceof apiError_1.ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        details = err.details;
    }
    else {
        logger_1.logger.error('Unhandled error', { error: err.message, stack: err.stack });
    }
    res.status(statusCode).json({
        success: false,
        message,
        details,
        ...(env_1.env.NODE_ENV === 'development' && !(err instanceof apiError_1.ApiError)
            ? { stack: err.stack }
            : {}),
    });
}
function notFoundMiddleware(req, res) {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
}
