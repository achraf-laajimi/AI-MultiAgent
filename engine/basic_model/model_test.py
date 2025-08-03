import json
import pickle
import random
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences 
from engine.complex import hybrid_responder

class AIModel:
    def __init__(self):
        # Load the intent data
        with open("engine/basic_model/intents.json") as file:
            self.data = json.load(file)
        
        # Load the trained model
        self.model = load_model("chat_model.h5")
        
        # Load the tokenizer
        with open("tokenizer.pkl", "rb") as f:
            self.tokenizer = pickle.load(f)
        
        # Load the label encoder
        with open("label_encoder.pkl", "rb") as encoder_file:
            self.label_encoder = pickle.load(encoder_file)
    
    def process_input(self, input_text):
        # Preprocess text
        input_text = input_text.lower().strip()
        padded_sequences = pad_sequences(
            self.tokenizer.texts_to_sequences([input_text]),
            maxlen=20,
            truncating='post'
        )

        predictions = self.model.predict(padded_sequences, verbose=0)[0]
        predicted_index = np.argmax(predictions)
        confidence = predictions[predicted_index]

        # Dynamic confidence threshold (raise to 0.8 for stricter matching)
        min_confidence = 0.8
        if confidence > min_confidence:
            tag = self.label_encoder.inverse_transform([predicted_index])[0]
            for intent in self.data['intents']:
                if intent['tag'] == tag:
                    return random.choice(intent['responses']), tag

        # Fallback for knowledge queries
        if any(x in input_text for x in ["what is", "who is", "how to"]):
            return "", "fallback"

        # If nothing matches, route to LLM for conversational response
        return "", "llm_direct"

# Initialize the model
ai_model = AIModel()

def handle_voice_command(query):
    """
    Process voice commands through both NLP model and direct commands
    """
    query = query.lower().strip()
    
    # First try direct commands
    response = process_direct_command(query)
    if response:
        return response, "direct_command"

    # If no direct command matched, use NLP model
    nlp_response, tag = ai_model.process_input(query)
    if tag == "fallback":
        return hybrid_responder(query), "researched"
    elif tag == "llm_direct":
        # Use LLM for open-ended/vague queries
        from engine.complex import get_ollama_response
        prompt = (
            f"The user said: '{query}'. Respond as a conversational assistant, asking for clarification or continuing the conversation naturally."
        )
        response, _ = get_ollama_response(prompt, max_tokens=100)
        return response, "llm_direct"
    return nlp_response, tag

def process_direct_command(query):
    """
    Handle direct commands that don't need NLP processing
    """
    if 'open' in query:
        from engine.features import openCommand
        openCommand(query)
        return f"Opening {query.replace('open', '').strip()}"

    # Extract search term for YouTube
    if "on youtube" in query:
        import re
        # Match 'play ... on youtube'
        match = re.search(r"play (.+?) on youtube", query)
        if match:
            search_term = match.group(1).strip()
            if search_term:
                from engine.features import PlayYoutube
                PlayYoutube(search_term)
                return f"Playing {search_term} on YouTube"
    
    elif any(cmd in query for cmd in ["system condition", "condition of the system"]):
        from engine.features import condition
        condition()
        return "Here's your system condition"
    
    elif any(cmd in query for cmd in ["volume up", "increase volume"]):
        import pyautogui
        pyautogui.press("volumeup")
        return "Volume increased"
    
    elif any(cmd in query for cmd in ["volume down", "decrease volume"]):
        import pyautogui
        pyautogui.press("volumedown")
        return "Volume decreased"
    
    elif any(cmd in query for cmd in ["volume mute", "mute the sound", "mute the volume"]):
        import pyautogui
        pyautogui.press("volumemute")
        return "Volume muted"
    
    return None
