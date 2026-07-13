"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMailWorker = startMailWorker;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const mail_queue_1 = require("./mail.queue");
const mailer_1 = require("../utils/mailer");
const logger_1 = require("../utils/logger");
function startMailWorker() {
    const worker = new bullmq_1.Worker(mail_queue_1.MAIL_QUEUE_NAME, async (job) => {
        const data = job.data;
        if (data.type === 'verification') {
            await (0, mailer_1.sendMail)({
                to: data.to,
                subject: 'Verify your email',
                html: (0, mailer_1.verificationEmailTemplate)(data.name, data.verifyUrl),
            });
        }
        else if (data.type === 'password-reset') {
            await (0, mailer_1.sendMail)({
                to: data.to,
                subject: 'Reset your password',
                html: (0, mailer_1.passwordResetEmailTemplate)(data.name, data.resetUrl),
            });
        }
    }, { connection: redis_1.redisConnectionOptions });
    worker.on('completed', (job) => logger_1.logger.info(`Mail job ${job.id} completed`));
    worker.on('failed', (job, err) => logger_1.logger.error(`Mail job ${job?.id} failed`, { error: err.message }));
    return worker;
}
