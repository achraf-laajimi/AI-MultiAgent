import sqlite3

# System applications to add
system_apps = [
    ('Cmd', r'C:\Windows\System32\cmd.exe'),
]

# Websites to add
websites = [
    ('GitHub', 'https://github.com'),
]

with sqlite3.connect("assisto.db") as conn:
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute("""CREATE TABLE IF NOT EXISTS sys_command
                      (id INTEGER PRIMARY KEY, name TEXT, path TEXT)""")
    
    cursor.execute("""CREATE TABLE IF NOT EXISTS web_command
                      (id INTEGER PRIMARY KEY, name TEXT, url TEXT)""")
    
    # Bulk insert system apps
    cursor.executemany("INSERT INTO sys_command (name, path) VALUES (?, ?)", system_apps)
    
    # Bulk insert websites
    cursor.executemany("INSERT INTO web_command (name, url) VALUES (?, ?)", websites)
    
    conn.commit()