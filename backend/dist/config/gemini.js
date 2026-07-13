"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeminiModel = getGeminiModel;
const generative_ai_1 = require("@google/generative-ai");
const env_1 = require("./env");
const genAI = new generative_ai_1.GoogleGenerativeAI(env_1.env.GEMINI_API_KEY);
function getGeminiModel() {
    return genAI.getGenerativeModel({ model: env_1.env.GEMINI_MODEL });
}
