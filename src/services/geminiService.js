import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_CONFIG } from '../config/constants.js';

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export const askGemini = async (question) => {
  if (!genAI) {
    return { error: 'Gemini API key is not configured.' };
  }

  const modelsToTry = [
    GEMINI_CONFIG.MODEL || 'gemini-3.6-flash',
    'gemini-3.6-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash'
  ];
  
  // Remove duplicates
  const uniqueModels = [...new Set(modelsToTry)];
  let lastError = null;

  for (const modelName of uniqueModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: GEMINI_CONFIG.SYSTEM_PROMPT || 'You are Sanatana Bot, a spiritual guide for Sanatana Dharma.'
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: question }] }],
        generationConfig: {
          maxOutputTokens: GEMINI_CONFIG.MAX_TOKENS || 1024,
        }
      });

      const response = await result.response;
      const text = response.text();

      if (text) {
        return { text };
      }
    } catch (err) {
      console.warn(`[GeminiService] Model ${modelName} error:`, err.message);
      lastError = err;
    }
  }

  console.error('Gemini API Error:', lastError);
  let errorMessage = 'An error occurred while communicating with Gemini.';
  if (lastError && lastError.message && lastError.message.includes('429')) {
    errorMessage = 'Rate limit exceeded. Please try again later.';
  }
  return { error: errorMessage };
};
