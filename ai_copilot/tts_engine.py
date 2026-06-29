import os
import pygame
import time
from dotenv import load_dotenv
from sarvamai import SarvamAI
from sarvamai.play import save

load_dotenv()

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

def speak(text: str, language_code: str = "hi-IN"):
    """
    Converts text to speech using Sarvam AI and plays the audio.
    language_code options: 'hi-IN' (Hindi), 'en-IN' (English with Indian accent), etc.
    """
    if not SARVAM_API_KEY or SARVAM_API_KEY == "YOUR_SARVAM_API_KEY_HERE":
        print(f"[TTS] Please set SARVAM_API_KEY in .env file to hear: {text}")
        return

    print(f"[AI]: {text}")

    try:
        # Initialize client with api_subscription_key
        client = SarvamAI(api_subscription_key=SARVAM_API_KEY)
        
        # Convert text to speech
        audio = client.text_to_speech.convert(
            text=text,
            target_language_code=language_code,
            model="bulbul:v3",
            speaker="meera"
        )
        
        temp_audio_file = "temp_response.wav"
        save(audio, temp_audio_file)
        
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
            
    except Exception as e:
        print(f"[TTS Error]: Failed to synthesize speech: {e}")

if __name__ == "__main__":
    # Test script
    speak("नमस्ते, मैं आपका एआई को-पायलट हूँ। मैं आपकी क्या मदद कर सकता हूँ?", "hi-IN")
