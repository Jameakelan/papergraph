import sqlite3
import os

db_path = "library/db/papers.db"

# Ensure directory exists
os.makedirs(os.path.dirname(db_path), exist_ok=True)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create table if not exists (it should exist from paper_db.py but just in case)
cursor.execute("""
    CREATE TABLE IF NOT EXISTS inbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT,
        body TEXT,
        status TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    );
""")

# Insert specific test message
cursor.execute("""
    INSERT INTO inbox (subject, body, status) 
    VALUES ('Welcome', 'This is a test message in your new Inbox.', 'unread')
""")

conn.commit()
print("Test message added to inbox.")
conn.close()
