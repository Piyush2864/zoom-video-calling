"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadChatFile = void 0;
const multer_1 = __importDefault(require("multer"));
const apiError_1 = require("../utils/apiError");
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
const storage = multer_1.default.memoryStorage();
exports.uploadChatFile = (0, multer_1.default)({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            return cb(apiError_1.ApiError.badRequest(`File type ${file.mimetype} is not allowed`));
        }
        cb(null, true);
    },
}).single('file');
