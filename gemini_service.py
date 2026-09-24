"""
🕉️ Sanatana Dharma AI Service using Google Gemini 3.6 Flash
Includes exponential backoff retries and multi-model fallbacks for 503 high-demand protection.
"""

import os
import time
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
            raise ImportError("Neither 'google-genai' nor 'google-generativeai' is installed.")

async def ask_hinduism_ai(prompt: str) -> str:
    """Queries Gemini 3.6 Flash API asynchronously with 503 high-demand retry logic and model fallbacks."""
    def _call():
        client_obj = get_gemini_client()

        # Target models in priority order
        candidate_models = ['gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-flash-latest']

        # Official Google GenAI SDK (google.genai)
        if hasattr(client_obj, 'models'):
            from google.genai import types
            
            last_error = None
            for model_name in candidate_models:
                # Up to 3 retries per model for 503 UNAVAILABLE spikes
                for attempt in range(3):
                    try:
                        response = client_obj.models.generate_content(
                            model=model_name,
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
                        err_str = str(e)
                        last_error = e
                        # If 503 UNAVAILABLE or 429 Rate Limit, wait briefly and retry
                        if "503" in err_str or "UNAVAILABLE" in err_str or "429" in err_str:
                            time.sleep(1.0 * (attempt + 1))
                            continue
                        else:
                            # If model not found or another error, try next candidate model
                            break

            if last_error:
                err_text = str(last_error)
                if "503" in err_text or "UNAVAILABLE" in err_text:
                    return ("🙏 **The Divine AI Wisdom service is experiencing temporary high demand on Google's servers.**\n\n"
                            "Spikes in traffic usually clear in a few seconds. Please try asking your question again in a moment! 🚩")
                raise last_error

            raise Exception("Gemini AI service returned empty response.")

        else:
            # Fallback legacy SDK
            model = client_obj.GenerativeModel('gemini-3.6-flash', system_instruction=SYSTEM_INSTRUCTION)
            for attempt in range(3):
                try:
                    response = model.generate_content(prompt)
                    if response and response.text:
                        return response.text.strip()
                except Exception as e:
                    if attempt < 2:
                        time.sleep(1.0 * (attempt + 1))
                        continue
                    raise e
            raise Exception("Gemini AI legacy request failed.")

    return await asyncio.to_thread(_call)
