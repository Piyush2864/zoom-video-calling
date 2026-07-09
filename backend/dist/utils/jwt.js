"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.generateTwoFactorTempToken = generateTwoFactorTempToken;
exports.verifyTwoFactorTempToken = verifyTwoFactorTempToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function generateAccessToken(payload) {
    const options = { expiresIn: env_1.env.JWT_ACCESS_EXPIRY };
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_ACCESS_SECRET, options);
}
function generateRefreshToken(payload) {
    const options = { expiresIn: env_1.env.JWT_REFRESH_EXPIRY };
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, options);
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
}
function generateTwoFactorTempToken(userId) {
    const payload = { userId, purpose: '2fa-login' };
    const options = {
        expiresIn: env_1.env.JWT_TWO_FACTOR_EXPIRY,
    };
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_TWO_FACTOR_SECRET, options);
}
function verifyTwoFactorTempToken(token) {
    const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_TWO_FACTOR_SECRET);
    if (payload.purpose !== '2fa-login') {
        throw new Error('Invalid token purpose');
    }
    return payload;
}
//# sourceMappingURL=jwt.js.map