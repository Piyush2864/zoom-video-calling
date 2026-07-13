import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { env } from './env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export function getGeminiModel(): GenerativeModel {
  return genAI.getGenerativeModel({ model: env.GEMINI_MODEL });
}
