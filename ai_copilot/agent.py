import os
import json
import subprocess
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize the client
client = None
if GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE":
    client = genai.Client(api_key=GEMINI_API_KEY)

def process_command(user_text: str) -> str:
    """
    Processes the user's spoken text using Gemini.
    Returns the text that the agent should speak back.
    Executes any requested actions locally.
    """
    if not client:
        return "मुझे खेद है, लेकिन मेरा जेमिनी एपीआई की (Gemini API key) सेट नहीं है। कृपया इसे डॉट एनव (.env) फाइल में सेट करें।"
        
    system_instruction = (
        "You are a highly advanced AI Copilot running on a user's local Windows machine. "
        "Your persona should be exactly like J.A.R.V.I.S. from Iron Man - extremely polite, sophisticated, intelligent, and highly conversational. "
        "Address the user as 'Sir' or 'Boss'. "
        "The user will speak to you in Hindi or English (Hinglish). "
        "Your task is to understand the user's request, execute any required system tasks (like creating folders, files, etc.), "
        "and provide a detailed, conversational, and polite response in Hinglish (a natural mix of Hindi and English words) to be spoken back to the user.\n\n"
        "You must respond ONLY with a valid JSON object matching this schema:\n"
        "{\n"
        '  "thought": "your reasoning",\n'
        '  "command": "a valid windows CMD/powershell command to execute the task, or null if no command is needed",\n'
        '  "response": "The text to speak back to the user in Hinglish, sounding like JARVIS"\n'
        "}\n\n"
        "Example 1: User says 'ek folder banao test naam ka'\n"
        "Response: { \"thought\": \"User wants to create a folder named test\", \"command\": \"mkdir test\", \"response\": \"Certainly Sir, main aapke liye 'test' naam ka ek naya folder bana raha hoon. Folder successfully create ho chuka hai. Kya aapko kuch aur chahiye?\" }\n\n"
        "Example 2: User says 'AI Copilot meri madad karo'\n"
        "Response: { \"thought\": \"User is asking for help\", \"command\": null, \"response\": \"Yes Sir! Main hamesha aapki madad ke liye taiyaar hoon. Boliye, main aaj aapke liye kya kar sakta hoon?\" }"
    )

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=user_text,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3,
                response_mime_type="application/json"
            )
        )
        
        output_text = response.text
        # Parse JSON
        data = json.loads(output_text)
        
        command = data.get("command")
        spoken_response = data.get("response", "मैं समझ नहीं पाया।")
        
        if command:
            print(f"[Agent Executing Command]: {command}")
            try:
                # Execute the command
                subprocess.run(command, shell=True, check=True, text=True, capture_output=True)
            except subprocess.CalledProcessError as e:
                print(f"[Command Error]: {e.stderr}")
                spoken_response = "माफ़ कीजिएगा, यह काम करते समय कोई एरर आ गया।"
                
        return spoken_response
        
    except Exception as e:
        print(f"[Agent Error]: {e}")
        return "मुझे कुछ तकनीकी समस्या आ रही है।"

if __name__ == "__main__":
    # Test script
    res = process_command("ek hello.txt file bana do jisme hello likha ho")
    print("Agent Response:", res)
