import sqlite3
from pathlib import Path

import dbhelpers
import datetime
from werkzeug.security import generate_password_hash


podcasts_db_path = "./db/podcasts.db"

table_schemas = {
    "users": '''
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  username TEXT NOT NULL,
  hash TEXT NOT NULL,
  role INTEGER DEFAULT 0 NOT NULL,
  registered_on TEXT
)''',
    "podcasts": '''
CREATE TABLE podcasts (
  podcast_id INTEGER PRIMARY KEY NOT NULL,
  podcast_name TEXT NOT NULL,
  author TEXT,
  website_url TEXT,
  rss_url TEXT NOT NULL,
  display_image TEXT DEFAULT "./static/default_image.jpg",
  description TEXT,
  latest_upload_date TEXT DEFAULT "2024-11-21 12:00:00.000"
)''',
    "episodes_list": '''
CREATE TABLE episodes_list (
  episode_id INTEGER,
  podcast_id INTEGER,
  episode_title TEXT,
  publication_date TEXT DEFAULT "2024-11-21 12:00:00.000",
  description TEXT,
  audio_url TEXT,
  duration TEXT,
  PRIMARY KEY (podcast_id, episode_id),
  FOREIGN KEY (podcast_id) REFERENCES podcasts (podcast_id)
)'''

}

example_users = [
    ["admin", generate_password_hash("admin"), datetime.datetime.now()],
    ["user_1", generate_password_hash("password"), datetime.datetime.now()],
    ["user_2", generate_password_hash("password"), datetime.datetime.now()],    
]

example_podcasts = [
    "https://feeds.libsyn.com/110110/rss",
    "https://feeds.megaphone.fm/GNL2128031227",
    "http://feeds.libsyn.com/426404/rss"
]

if not Path(podcasts_db_path).is_file():
    try:
        with sqlite3.connect("./db/podcasts.db") as conn:
            cursor = conn.cursor()
            
            print("Creating new database...")
            for table in table_schemas:
                print(f"Creating table: {table}")
                cursor.execute(table_schemas[table])
            
            print("Creating example users:")
            for user in example_users:
                print(f"Creating user '{user[0]}'")
                dbhelpers.add_user(user, conn)
                
            print("Adding example podcasts")
            for podcast in example_podcasts:
                dbhelpers.add_new_podcast(podcast, conn)
            
            print("Database initialization complete.")
    except sqlite3.OperationalError as e:
        print(f"An error occurred while creating a new database: ${e}")
else:
    print("Database already exists.")