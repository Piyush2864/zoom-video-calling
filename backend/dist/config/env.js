"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('5000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    CLIENT_URL: zod_1.z.string().url(),
    MONGO_URI: zod_1.z.string().min(1, 'MONGO_URI is required'),
    REDIS_URL: zod_1.z.string().min(1, 'REDIS_URL is required'),
    JWT_ACCESS_SECRET: zod_1.z.string().min(10, 'JWT_ACCESS_SECRET too short'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(10, 'JWT_REFRESH_SECRET too short'),
    JWT_ACCESS_EXPIRY: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRY: zod_1.z.string().default('7d'),
    JWT_TWO_FACTOR_SECRET: zod_1.z.string().min(10, 'JWT_TWO_FACTOR_SECRET too short'),
    JWT_TWO_FACTOR_EXPIRY: zod_1.z.string().default('5m'),
    GOOGLE_CLIENT_ID: zod_1.z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
    COOKIE_DOMAIN: zod_1.z.string().default('localhost'),
    SMTP_HOST: zod_1.z.string().min(1, 'SMTP_HOST is required'),
    SMTP_PORT: zod_1.z.string().default('587'),
    SMTP_USER: zod_1.z.string().min(1, 'SMTP_USER is required'),
    SMTP_PASS: zod_1.z.string().min(1, 'SMTP_PASS is required'),
    MAIL_FROM: zod_1.z.string().min(1, 'MAIL_FROM is required'),
    APP_NAME: zod_1.z.string().default('ZoomClone'),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
    CLOUDINARY_API_KEY: zod_1.z.string().min(1, 'CLOUDINARY_API_KEY is required'),
    CLOUDINARY_API_SECRET: zod_1.z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
    STUN_URLS: zod_1.z.string().default('stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302'),
    TURN_URL: zod_1.z.string().optional(),
    TURN_USERNAME: zod_1.z.string().optional(),
    TURN_CREDENTIAL: zod_1.z.string().optional(),
    GEMINI_API_KEY: zod_1.z.string().min(1, 'GEMINI_API_KEY is required'),
    GEMINI_MODEL: zod_1.z.string().default('gemini-1.5-flash'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
