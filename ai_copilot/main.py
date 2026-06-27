import time
from stt_engine import listen
from tts_engine import speak
from agent import process_command

def main():
    print("="*50)
    print("   AI COPILOT IS STARTING...")
    print("="*50)
    
    # Greet the user on startup
    speak("Hello Sir. Main aapka AI Copilot hoon. Systems are online and ready. Boliye, main aapki kya help kar sakta hoon?", "hi-IN")
    
    while True:
        # 1. Listen to the user
        user_input = listen()
        
        # If nothing was heard, loop back
        if not user_input.strip():
            continue
            
        # Exit condition
        if user_input.lower() in ["exit", "quit", "stop", "band karo", "ruk jao"]:
            speak("Okay, main ab band ho raha hoon. Bye!", "hi-IN")
            break
            
        # 2. Process with Agent (LLM)
        print("[Agent is thinking...]")
        response_text = process_command(user_input)
        
        # 3. Speak the response
        speak(response_text, "hi-IN")
        
        # Short pause before listening again
        time.sleep(1)

if __name__ == "__main__":
    main()
