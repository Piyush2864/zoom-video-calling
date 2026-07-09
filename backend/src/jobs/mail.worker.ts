import { Worker } from 'bullmq';
import { redisConnectionOptions } from '../config/redis';
import { MAIL_QUEUE_NAME, MailJobData } from './mail.queue';
import { sendMail, verificationEmailTemplate, passwordResetEmailTemplate } from '../utils/mailer';
import { logger } from '../utils/logger';

export function startMailWorker(): Worker<MailJobData> {
  const worker = new Worker<MailJobData>(
    MAIL_QUEUE_NAME,
    async (job) => {
      const data = job.data;

      if (data.type === 'verification') {
        await sendMail({
          to: data.to,
          subject: 'Verify your email',
          html: verificationEmailTemplate(data.name, data.verifyUrl),
        });
      } else if (data.type === 'password-reset') {
        await sendMail({
          to: data.to,
          subject: 'Reset your password',
          html: passwordResetEmailTemplate(data.name, data.resetUrl),
        });
      }
    },
    { connection: redisConnectionOptions }
  );

  worker.on('completed', (job) => logger.info(`Mail job ${job.id} completed`));
  worker.on('failed', (job, err) =>
    logger.error(`Mail job ${job?.id} failed`, { error: err.message })
  );

  return worker;
}
