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

  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_CONFIG.MODEL || 'gemini-1.5-flash',
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

    if (!text) {
      return { error: 'Received an empty response from Gemini.' };
    }

    return { text };
  } catch (err) {
    console.error('Gemini API Error:', err);
    let errorMessage = 'An error occurred while communicating with Gemini.';
    if (err.message && err.message.includes('429')) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    }
    return { error: errorMessage };
  }
};
