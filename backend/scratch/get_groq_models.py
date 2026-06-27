import os
import requests
from dotenv import load_dotenv

load_dotenv("backend/.env")

key = os.getenv("GROQ_API_KEY")
print("Key prefix:", key[:10] if key else "None")

headers = {
    "Authorization": f"Bearer {key}"
}
url = "https://api.groq.com/openai/v1/models"
try:
    resp = requests.get(url, headers=headers, timeout=10.0)
    if resp.status_code == 200:
        models = resp.json().get("data", [])
        print("Available Groq Models:")
        for m in models:
            print(f" - {m.get('id')}")
    else:
        print(f"Failed. Status: {resp.status_code}, Body: {resp.text}")
except Exception as e:
    print("Error:", e)
