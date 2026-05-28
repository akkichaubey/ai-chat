import os
from google import genai
from google.genai import types

def load_gemini_api_key() -> str:
    # 1. Check OS environment variables
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        return api_key
    
    # 2. Try to read from .env.local in the project root
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        env_path = os.path.join(current_dir, ".env.local")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("GEMINI_API_KEY="):
                        val = line.split("=", 1)[1].strip()
                        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                            val = val[1:-1]
                        return val
    except Exception:
        pass
    
    return ""

def start_ai_analysis(user_query: str):
    """
    Runs a real-time AI analysis using the Google GenAI SDK, 
    leveraging the Gemma 4 reasoning model with Google Search grounding enabled.
    """
    # Get the API Key from environment or .env.local file
    api_key = load_gemini_api_key()
    
    if not api_key:
        print("[ERROR] Please provide your API Key in .env.local or set the GEMINI_API_KEY environment variable.")
        print("You can get a free API Key from Google AI Studio: https://aistudio.google.com/")
        return

    # Initialize the GenAI Client with the api_key
    client = genai.Client(api_key=api_key)

    # gemma-4-31b-it supports advanced reasoning/thinking
    model_id = "gemma-4-31b-it"

    # Wrap the user query in Content and Part types
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=user_query),
            ],
        ),
    ]

    # Generation Config: Set thinking level to 'high' for deep reasoning
    generate_content_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_level="high",  # 'high' reasoning/thinking level for gemma-4
        )
    )

    print("\n[AI] AI is thinking and reasoning (using Gemma 4)... Please wait...\n")
    print("-" * 60)

    try:
        # Stream the output chunks as they are generated
        response_stream = client.models.generate_content_stream(
            model=model_id,
            contents=contents,
            config=generate_content_config,
        )
        
        for chunk in response_stream:
            if chunk.text:
                print(chunk.text, end="", flush=True)
        
        print("\n" + "-" * 60)
        print("\n[SUCCESS] Analysis Complete!")

    except Exception as e:
        print(f"\n[ERROR] An error occurred: {e}")

# ============================================================
# MAIN EXECUTION BLOCK
# ============================================================
if __name__ == "__main__":
    # Example market analysis query for BTC
    my_question = """
    I am analyzing the BTCUSD chart. The price dropped from $76,000 to $74,800 
    and is now showing a small bounce. 
    1. Use Google Search to check if there is any breaking news in the last 4 hours 
       regarding Bitcoin, SEC, or Macro-economic data.
    2. Analyze if this bounce is a 'Dead Cat Bounce' or a genuine reversal.
    3. Give me key support and resistance levels for the next 12 hours.
    """

    start_ai_analysis(my_question)
