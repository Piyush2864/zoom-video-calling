"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
exports.verificationEmailTemplate = verificationEmailTemplate;
exports.passwordResetEmailTemplate = passwordResetEmailTemplate;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const logger_1 = require("./logger");
const transporter = nodemailer_1.default.createTransport({
    host: env_1.env.SMTP_HOST,
    port: Number(env_1.env.SMTP_PORT),
    secure: Number(env_1.env.SMTP_PORT) === 465,
    auth: {
        user: env_1.env.SMTP_USER,
        pass: env_1.env.SMTP_PASS,
    },
});
async function sendMail({ to, subject, html }) {
    await transporter.sendMail({
        from: env_1.env.MAIL_FROM,
        to,
        subject,
        html,
    });
    logger_1.logger.info(`Mail sent to ${to}: ${subject}`);
}
function verificationEmailTemplate(name, verifyUrl) {
    return `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Verify your email</h2>
      <p>Hi ${name},</p>
      <p>Thanks for signing up on ${env_1.env.APP_NAME}. Please verify your email address to activate your account.</p>
      <p><a href="${verifyUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Verify Email</a></p>
      <p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
    </div>
  `;
}
function passwordResetEmailTemplate(name, resetUrl) {
    return `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Reset your password</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your ${env_1.env.APP_NAME} password. Click below to set a new one.</p>
      <p><a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Reset Password</a></p>
      <p>This link expires in 15 minutes. If you didn't request this, you can safely ignore this email — your password will not change.</p>
    </div>
  `;
}
