"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController = __importStar(require("./user.controller"));
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const upload_middleware_1 = require("../../middlewares/upload.middleware");
const user_validation_1 = require("./user.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/me', userController.getMe);
router.patch('/me', (0, validate_middleware_1.validate)(user_validation_1.updateProfileSchema), userController.updateProfile);
router.patch('/me/settings', (0, validate_middleware_1.validate)(user_validation_1.updateSettingsSchema), userController.updateSettings);
router.patch('/me/password', (0, validate_middleware_1.validate)(user_validation_1.changePasswordSchema), userController.changePassword);
router.delete('/me', (0, validate_middleware_1.validate)(user_validation_1.deleteAccountSchema), userController.deleteAccount);
router.post('/me/avatar', upload_middleware_1.uploadAvatar, userController.uploadAvatar);
router.delete('/me/avatar', userController.removeAvatar);
router.get('/:id', userController.getPublicProfile);
exports.default = router;
