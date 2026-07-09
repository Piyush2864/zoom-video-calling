"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailQueue = exports.MAIL_QUEUE_NAME = void 0;
exports.enqueueVerificationEmail = enqueueVerificationEmail;
exports.enqueuePasswordResetEmail = enqueuePasswordResetEmail;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
exports.MAIL_QUEUE_NAME = 'mail-queue';
exports.mailQueue = new bullmq_1.Queue(exports.MAIL_QUEUE_NAME, {
    connection: redis_1.redisConnectionOptions,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
});
function enqueueVerificationEmail(to, name, verifyUrl) {
    return exports.mailQueue.add('send-mail', { type: 'verification', to, name, verifyUrl });
}
function enqueuePasswordResetEmail(to, name, resetUrl) {
    return exports.mailQueue.add('send-mail', { type: 'password-reset', to, name, resetUrl });
}
//# sourceMappingURL=mail.queue.js.map