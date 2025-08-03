import sys
from playsound import playsound
from engine.command import speak
import eel
import pywhatkit as kit
import os
import sqlite3
import re
import webbrowser
import psutil 

conn = sqlite3.connect("assisto.db")
cursor = conn.cursor()

@eel.expose
def playClickSound():
    music_dir = "www/assets/audio/click_sound.mp3"
    playsound(music_dir)


def openCommand(query):
    # Remove wake word and normalize
    query = query.lower().replace("Grace", "").strip()
    # New: Remove time-related words
    time_words = ["now", "immediately", "right now"]
    for word in time_words:
        query = query.replace(word, "")
    query = query.strip()
    
    # Extract target using improved patterns
    patterns = [
        r"open\s+(.+)",          # "open github"
        r"start\s+(.+)",         # "start github"
        r"launch\s+(.+)",        # "launch github"
        r"i\s+want\s+(?:.*)\s+(.+)",  # "i want github"
        r"can\s+you\s+open\s+(.+)"    # "can you open github"
    ]
    target = None
    for pattern in patterns:
        match = re.search(pattern, query)
        if match:
            target = match.group(1).strip()
            break
    if not target:
        speak("I didn't understand what you want me to open")
        return
    try:
        # System applications
        cursor.execute('SELECT path FROM sys_command WHERE LOWER(name) LIKE ?', 
                      (f"%{target}%",))
        if result := cursor.fetchone():
            speak(f"Opening {target}")
            os.startfile(result[0])
            return
        # Websites (using LIKE for partial matches)
        cursor.execute('SELECT url FROM web_command WHERE LOWER(name) LIKE ?', 
                      (f"%{target}%",))
        if result := cursor.fetchone():
            speak(f"Opening {target}")
            webbrowser.open(result[0])
            return
        # Direct execution attempt
        speak(f"Trying to open {target}")
        try:
            if sys.platform == "win32":
                os.system(f'start {target}')
            else:  # Mac/Linux
                os.system(f'open {target}' if sys.platform == "darwin" else f'xdg-open {target}')
        except Exception as e:
            speak(f"Couldn't open {target}. Please check if it's installed.")
    except Exception as e:
        speak(f"An error occurred: {str(e)}")


def PlayYoutube(query):
    search_term = extract_yt_term(query)
    if search_term:
        speak("Playing " + search_term + " on YouTube")
        kit.playonyt(search_term)
    else:
        speak("Sorry, I couldn't find what to play on YouTube.")


def extract_yt_term(command):
    pattern = r'play\s+(.*?)\s+on\s+youtube'
    match = re.search(pattern, command, re.IGNORECASE)
    return match.group(1) if match else None

def condition():
    speak("checking the system condition")
    usage = str(psutil.cpu_percent())
    speak(f"CPU is at {usage} percentage")
    battery = psutil.sensors_battery()
    percentage = battery.percent
    speak(f"Sir our system have {percentage} percentage battery")

    if percentage>=80:
        speak("we could have enough charging to continue our recording")
    elif percentage>=40 and percentage<=75:
        speak("we should connect our system to charging point to charge our battery")
    else:
        speak("we have very low power, please connect to charging otherwise recording should be off...")

