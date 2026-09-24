"""
🕉️ Sanatana Dharma AI Service using Google Gemini 3.6 Flash
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

def get_gemini_client():
    global _client
    if _client is not None:
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
            return legacy_genai
        except ImportError:
            raise ImportError("Neither 'google-genai' nor 'google-generativeai' is installed. Please run `pip install google-genai`.")

async def ask_hinduism_ai(prompt: str) -> str:
    """Queries Gemini 3.6 Flash API asynchronously with Sanatana Dharma system instructions."""
    def _call():
        client_obj = get_gemini_client()

        # Official Google GenAI SDK (google.genai)
        if hasattr(client_obj, 'models'):
            from google.genai import types
            response = client_obj.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.7,
                    max_output_tokens=1000,
                )
            )
            if response and response.text:
                return response.text.strip()
            raise Exception("Gemini AI returned empty response.")
        else:
            # Fallback legacy SDK
            model = client_obj.GenerativeModel('gemini-3.6-flash', system_instruction=SYSTEM_INSTRUCTION)
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
            raise Exception("Gemini AI legacy request failed.")

    return await asyncio.to_thread(_call)
