import speech_recognition as sr

def listen() -> str:
    """
    Listens to the microphone and returns the transcribed text.
    Uses Google's free Web Speech API (via SpeechRecognition).
    """
    recognizer = sr.Recognizer()
    
    with sr.Microphone() as source:
        print("\n[Listening... Speak now]")
        # Adjust for ambient noise
        recognizer.adjust_for_ambient_noise(source, duration=0.5)
        try:
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=15)
            print("[Processing audio...]")
            
            # Use Google's free recognition (you can specify language='hi-IN' if you want it to listen in Hindi specifically)
            # Defaulting to 'hi-IN' to understand hindi/hinglish commands better
            text = recognizer.recognize_google(audio, language="hi-IN")
            print(f"[You said]: {text}")
            return text
        
        except sr.WaitTimeoutError:
            print("[STT Timeout]: No speech detected.")
            return ""
        except sr.UnknownValueError:
            print("[STT Error]: Could not understand audio.")
            return ""
        except sr.RequestError as e:
            print(f"[STT Error]: Could not request results; {e}")
            return ""

if __name__ == "__main__":
    # Test script
    text = listen()
    print("Final output:", text)
