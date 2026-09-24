"""
🕉️ Sanatana Dharma AI Service using Google Gemini AI
"""

import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

SYSTEM_INSTRUCTION = """
You are Sanatana Dharma AI (सनातनी ज्ञान), a reverent, wise, and authoritative spiritual assistant specialized in Hinduism and Vedic wisdom.

Your purpose is to answer all spiritual, philosophical, scriptural, mythological, ritual, and daily life questions rooted authentically in Hindu scriptures:
- Vedas, Upanishads, Bhagavad Gita, Ramayana, Mahabharata, Puranas, Yoga Sutras, and Darshanas (Nyaya, Vaisheshika, Samkhya, Yoga, Mimamsa, Vedanta).

Guidelines:
1. Always maintain a respectful, inspiring, and authentic tone.
2. Root your answers directly in Hindu philosophy and scriptural wisdom.
3. Where appropriate, provide concise Sanskrit shlokas or terms with clear translations.
4. Keep answers clean, engaging, and well-formatted with markdown for Discord (bullet points, bold headers, emojis like 🚩, 🕉️, 🔱, 🪔, 🌸, 📖).
5. Keep responses concise and under 1800 characters to fit Discord message limits.
"""

_client = None
_legacy_genai = None

def get_gemini_client():
    global _client, _legacy_genai
    if _client is not None or _legacy_genai is not None:
        return _client

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is missing in .env")

    try:
        from google import genai
        _client = genai.Client(api_key=api_key)
        return _client
    except ImportError:
        try:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=api_key)
            _legacy_genai = legacy_genai
            return None
        except ImportError:
            raise ImportError("Neither 'google-genai' nor 'google-generativeai' is installed. Please run `pip install google-genai`.")

async def ask_hinduism_ai(prompt: str) -> str:
    """Queries Gemini API asynchronously with Sanatana Dharma system instructions."""
    def _call():
        global _client, _legacy_genai
        get_gemini_client()

        if _client:
            from google.genai import types
            models_to_try = ['gemini-3.6-flash', 'gemini-1.5-flash', 'gemini-2.0-flash']
            last_error = None
            for m in models_to_try:
                try:
                    response = _client.models.generate_content(
                        model=m,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=SYSTEM_INSTRUCTION,
                            temperature=0.7,
                            max_output_tokens=1000,
                        )
                    )
                    if response and response.text:
                        return response.text.strip()
                except Exception as e:
                    last_error = e
                    continue
            raise last_error or Exception("Gemini AI request failed.")
        
        elif _legacy_genai:
            model = _legacy_genai.GenerativeModel('gemini-1.5-flash', system_instruction=SYSTEM_INSTRUCTION)
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
            raise Exception("Legacy Gemini request failed.")

    return await asyncio.to_thread(_call)
