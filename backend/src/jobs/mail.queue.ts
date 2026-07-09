import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../config/redis';

export const MAIL_QUEUE_NAME = 'mail-queue';

export type MailJobData =
  | { type: 'verification'; to: string; name: string; verifyUrl: string }
  | { type: 'password-reset'; to: string; name: string; resetUrl: string };

export const mailQueue = new Queue<MailJobData, void, 'send-mail'>(MAIL_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export function enqueueVerificationEmail(to: string, name: string, verifyUrl: string) {
  return mailQueue.add('send-mail', { type: 'verification', to, name, verifyUrl });
}

export function enqueuePasswordResetEmail(to: string, name: string, resetUrl: string) {
  return mailQueue.add('send-mail', { type: 'password-reset', to, name, resetUrl });
}
