import os, time
from google import genai

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
models = [os.environ["GEMINI_MODEL"], "gemma-4-31b-it", "gemini-2.5-flash"]
for model in models:
    for attempt in range(1, 4):
        try:
            r = client.models.generate_content(model=model, contents='Reply with the JSON {"ok": true}')
            print(model, "OK:", r.text)
            break
        except Exception as e:
            print(model, "attempt", attempt, "FAILED:", type(e).__name__, str(e)[:120])
            time.sleep(3)