import os
import eel
import requests
from dotenv import load_dotenv

load_dotenv()

@eel.expose
def enhance_prompt(prompt: str) -> str:
    """
    Enhance a prompt using Bria AI's prompt enhancement service.
    
    Args:
        prompt: Original prompt to enhance
    
    Returns:
        Enhanced prompt string or original if enhancement fails
    """
    api_key = os.getenv('BRIA_API_KEY')
    if not api_key:
        raise ValueError("API key not found in .env file")
    
    url = "https://engine.prod.bria-api.com/v1/prompt_enhancer"
    
    headers = {
        'api_token': api_key,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
    
    data = {'prompt': prompt}
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f"API status: {response.status_code}")
        print(f"API response: {response.text}")
        response.raise_for_status()
        result = response.json()
        print(f"Parsed JSON: {result}")
        return result.get("prompt variations", prompt)  # Return enhanced or original
    except Exception as e:
        print(f"Error enhancing prompt: {str(e)}")
        return prompt  # Fallback to original prompt