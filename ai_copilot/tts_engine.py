import os
import requests
import base64
import pygame
import time
from dotenv import load_dotenv

load_dotenv()

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
TTS_URL = "https://api.sarvam.ai/text-to-speech"

def speak(text: str, language_code: str = "hi-IN"):
    """
    Converts text to speech using Sarvam AI and plays the audio.
    language_code options: 'hi-IN' (Hindi), 'en-IN' (English with Indian accent), etc.
    """
    if not SARVAM_API_KEY or SARVAM_API_KEY == "YOUR_SARVAM_API_KEY_HERE":
        print(f"[TTS] Please set SARVAM_API_KEY in .env file to hear: {text}")
        return

    print(f"[AI]: {text}")
    
    payload = {
        "text": text,
        "target_language_code": language_code,
        "speaker": "meera",
        "model": "bulbul:v3"
    }
    
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(TTS_URL, json=payload, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        if "audios" in data and len(data["audios"]) > 0:
            audio_base64 = data["audios"][0]
            audio_bytes = base64.b64decode(audio_base64)
            
            # Save temporary audio file
            temp_audio_file = "temp_response.wav"
            with open(temp_audio_file, "wb") as f:
                f.write(audio_bytes)
                
            # Play the audio using pygame
            pygame.mixer.init(frequency=8000)
            pygame.mixer.music.load(temp_audio_file)
            pygame.mixer.music.play()
            
            while pygame.mixer.music.get_busy():
                time.sleep(0.1)
                
            pygame.mixer.quit()
            
            # Clean up temp file
            if os.path.exists(temp_audio_file):
                os.remove(temp_audio_file)
        else:
            print("[TTS Error]: No audio returned from Sarvam API.")
            
    except Exception as e:
        print(f"[TTS Error]: Failed to synthesize speech: {e}")

if __name__ == "__main__":
    # Test script
    speak("नमस्ते, मैं आपका एआई को-पायलट हूँ। मैं आपकी क्या मदद कर सकता हूँ?", "hi-IN")
