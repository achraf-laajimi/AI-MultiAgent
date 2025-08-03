import time
import pyttsx3
import speech_recognition as sr
import eel
import datetime
from engine.basic_model.model_test import handle_voice_command


def speak(text):
    engine = pyttsx3.init()
    voices = engine.getProperty('voices')
    engine.setProperty('voice', voices[1].id)
    engine.setProperty('rate', 170)
    engine.say(text)
    engine.runAndWait()

# speak("how can I help you Sir?")

def cal_day():
    day = datetime.datetime.today().weekday() + 1
    day_dict={
        1:"Monday",
        2:"Tuesday",
        3:"Wednesday",
        4:"Thursday",
        5:"Friday",
        6:"Saturday",
        7:"Sunday"
    }
    if day in day_dict.keys():
        day_of_week = day_dict[day]
        print(day_of_week)
    return day_of_week

def greeting():
    hour = int(datetime.datetime.now().hour)
    t = time.strftime("%I:%M:%p")
    day = cal_day()

    if(hour>=0) and (hour<=12) and ('AM' in t):
        speak(f"Good morning Sir, it's {day} and the time is {t}")
    elif(hour>=12)  and (hour<=16) and ('PM' in t):
        speak(f"Good afternoon Sir, it's {day} and the time is {t}")
    else:
        speak(f"Good evening Sir, it's {day} and the time is {t}")



@eel.expose
def takeCommand():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        time.sleep(2) 
        print('Listening...')
        eel.DisplayMessage('Listening...')
        r.pause_threshold = 1
        r.adjust_for_ambient_noise(source)
        audio = r.listen(source, timeout=10, phrase_time_limit=6)
    
    try:
        print('Recognizing...')
        eel.DisplayMessage('Recognizing...')
        query = r.recognize_google(audio, language='en')
        print(f'User said: {query}')
        eel.DisplayMessage('')

    except Exception as e:
        eel.DisplayMessage("Sorry, I didn't catch that")
        return ""
    
    return query.lower()

@eel.expose
def allCommands():
    """Process all voice commands in a continuous loop"""
    while True:  # Continuous listening loop
        query = takeCommand()
        if not query:  # If no query was captured
            continue  # Skip to next iteration
        
        print("Processing command:", query)
        
        try:
            # Get response from AI model or direct commands
            response, tag = handle_voice_command(query)
            
            # Speak and display the response
            if response:
                eel.DisplayMessage(response)
                print("AI Response:", response)
                speak(response)
            
            # Show hood only for goodbye and break the loop
            if tag == "goodbye":
                time.sleep(1)
                eel.ShowHood()
                break  # Exit the loop after goodbye
            
            # For other commands, continue listening
            time.sleep(1)  # Short pause before listening again
            
        except Exception as e:
            print(f"Command processing error: {e}")
            speak("Sorry, I had trouble processing that command.")
            eel.DisplayMessage("Command processing error")
            continue
