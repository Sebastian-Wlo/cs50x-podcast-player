import feedparser
import datetime
from markupsafe import Markup

def update_table(database, table, column, record, record_id):
    db = database.cursor()
    db.execute(f"UPDATE {table} SET ({column}) = (?) WHERE id={record_id}", (record,))
    database.commit()

def add_episode(database, table, podcast_id, episode_id, ep_title, pub_date, description, url):
    db = database.cursor()
    db.execute(f"INSERT INTO  {table} (podcast_id, episode_id, episode_title, publication_date, description, audio_url) VALUES (?, ?, ?, ?, ?, ?)", (podcast_id, episode_id, ep_title, pub_date, description, url))
    database.commit()


    
""" Getting information from the database """
def get_user_list(database):
    db = database.cursor()
    db.execute("SELECT * FROM users")
    response = db.fetchall()
    data = []
    for n in range(0, len(response)):
        data.append(
            {
                "id": response[n]["id"],
                "username": response[n]["username"],
                "role": response[n]["role"],
                "registered": response[n]["registered_on"]
            }
        )
    return data

def get_podcasts_list(database):
    db = database.cursor()
    db.execute("SELECT * FROM podcasts")
    response = db.fetchall()

    data = []
    # If there are no podcasts on the list, add 3 placeholders:
    if len(response) > 0:
        for n in range(0, len(response)):
            episodes = get_episodes_list(database, response[n]["podcast_id"])
            data.append(
                {
                    "title": response[n]["podcast_name"],
                    "author": response[n]["author"],
                    "description": response[n]["description"],
                    "coverimage": response[n]["display_image"],
                    "id": response[n]["podcast_id"],
                    "episodeCount": str(len(episodes)),
                    "latestUpload": response[n]["latest_upload_date"]
                }
            )
    return data

def get_episodes_list(database, podcast_id=None, reversed=None):
    db = database.cursor()
    data = []
    if not podcast_id:
        # If no podcast was chosen
        print("no podcast_id given")
    else:
        response = db.execute('''
                            SELECT
                                podcasts.author,
                                episodes_list.episode_id,
                                episodes_list.episode_title,
                                episodes_list.publication_date,
                                episodes_list.description,
                                episodes_list.audio_url,
                                episodes_list.duration
                            FROM podcasts JOIN episodes_list
                            ON podcasts.podcast_id=episodes_list.podcast_id
                            WHERE episodes_list.podcast_id=?''', (podcast_id,))
        response = db.fetchall()
        for n in range(0, len(response)):
            # Shorten description to 255 characters to speed up loading lists
            if len(response[n]["description"]) > 255:
                description = (response[n]["description"][:252] + "...")
                description_full = Markup(response[n]["description"])
            else: 
                description = Markup(response[n]["description"])
                description_full = ""
                
            data.append(
                {
                    "id": response[n]["episode_id"],
                    "author": response[n]["author"],
                    "title": response[n]["episode_title"],
                    "publication_date": response[n]["publication_date"],
                    "description": description,
                    "description_full": description_full,
                    "audio_url": response[n]["audio_url"],
                    "duration" : response[n]["duration"]
                }
            )
        # Reverse the order of the list if prompted
        if reversed:
            data.reverse()

    return data

""" Database operations: """

def find_user(username, database):
    db = database.cursor()
    db.execute("SELECT id, username, role, hash FROM users WHERE username=?", (username,))
    db_entry_exists = db.fetchall()
    if len(db_entry_exists) !=0:
        return db_entry_exists[0]
    else:
        return 0

def add_user(userdata, database):
    db = database.cursor()
    db.execute("SELECT * FROM users")
    number_of_users = db.fetchall()
    #print(number_of_users, len(number_of_users))
    if len(number_of_users) > 0:
        db.execute("INSERT INTO USERS (username, hash, registered_on) VALUES (?, ?, ?)", (userdata[0], userdata[1], userdata[2]))
        #db.execute("INSERT INTO USERS (username, hash) VALUES (?, ?)", (userdata[0], userdata[1]))
    else:
        db.execute("INSERT INTO USERS (username, hash, registered_on, role) VALUES (?, ?, ?, ?)", (userdata[0], userdata[1], userdata[2], 1))
        #db.execute("INSERT INTO USERS (username, hash, role) VALUES (?, ?, ?)", (userdata[0], userdata[1], 1))
    database.commit()
def change_user_password(userdata, database):
    db = database.cursor()
    db.execute("UPDATE users SET hash = ? WHERE id=?",(userdata[1], userdata[0]))
    database.commit()
    
def add_new_podcast(url, database):
    # Parse the given url for podcast info and episode list
    podcast_data = get_podcast_details(url)
    if podcast_data == 1:
        return 1
    episode_list = get_podcast_episodes(url)

    db = database.cursor()
    # Check if podcast's rss feed is already in the database
    db.execute("SELECT rss_url FROM podcasts WHERE rss_url=?", (url,))
    db_entry_exists = db.fetchall()
    
    if len(db_entry_exists) == 0:
        # Add podcast data into the database
        db.execute("INSERT INTO podcasts (podcast_name, author, website_url, rss_url, display_image, description) VALUES (?, ?, ?, ?, ?, ?)", (podcast_data["podcast_name"], podcast_data["author"], podcast_data["website_url"], podcast_data["rss_url"], podcast_data["display_image"], podcast_data["description"]))
        database.commit()
        
        # Get the podcast id
        podcast_id = db.execute("SELECT podcast_id FROM podcasts WHERE rss_url=?", (podcast_data["rss_url"],))
        podcast_id = db.fetchone()[0]
        
        # Add episode list into the database
        for n in range(0, len(episode_list)):
            episode_id = len(episode_list) - n
            db.execute("INSERT INTO episodes_list (podcast_id, episode_id, episode_title, publication_date, description, audio_url, duration) VALUES (?, ?, ?, ?, ?, ?, ?)", (podcast_id, episode_id, episode_list[n]["episode_title"], episode_list[n]["publication_date"], episode_list[n]["description"], episode_list[n]["audio_url"], episode_list[n]["duration"])) 
            #db.execute("INSERT INTO episodes_list (podcast_id, episode_id, episode_title, publication_date, description, audio_url) VALUES (?, ?, ?, ?, ?, ?)", (podcast_id, episode_id, episode_list[n]["episode_title"], episode_list[n]["publication_date"], episode_list[n]["description"], episode_list[n]["audio_url"]))
        
        
        #Add latest episode date to the podcast entry
        last_update = convert_date(episode_list[0]["publication_date"])
        db.execute("UPDATE podcasts SET latest_upload_date = ? WHERE podcast_id=?",(last_update, podcast_id))
        database.commit()
        return 0
    else:
        return 1

def add_new_episodes(episode_list, podcast_id, database):
    db = database.cursor()
    current_episodes = get_episodes_list(database, podcast_id)
    episode_count = len(current_episodes) + 1
    for episode in episode_list:
        add_episode(database, 'episodes_list', podcast_id, episode_count, episode["episode_title"], episode["publication_date"], episode["description"], episode["audio_url"])
        episode_count += 1
    new_episode_dates = db.execute("SELECT publication_date FROM episodes_list WHERE podcast_id = ?", (podcast_id,))
    response = db.fetchall()
    db.execute("UPDATE podcasts SET latest_upload_date = ? WHERE podcast_id=?",(convert_date(response[-1][0]), podcast_id))
    database.commit()
 
def remove_podcast(podcast_id, database):
    db = database.cursor()
    # Check if podcast with this is is on the podcast's list
    db.execute("SELECT rss_url FROM podcasts WHERE podcast_id=?", (podcast_id,))
    response = db.fetchall()
    
    if len(response) != 1:
        return False
    else:
        db.execute("DELETE FROM episodes_list WHERE podcast_id=?", (podcast_id))
        db.execute("DELETE FROM podcasts WHERE podcast_id=?", (podcast_id))
        database.commit()
        return True

def remove_user(user_id, database):
    db = database.cursor()
    db.execute("DELETE FROM users WHERE id=?", (user_id,))
    database.commit()
    return 0

def change_user_role(user_id, database):
    db = database.cursor()
    db.execute("SELECT role FROM users WHERE id=?", (user_id,))
    response = db.fetchall()
    if response[0]["role"] == 0:
        db.execute("UPDATE users SET role = 1 WHERE id=?", (user_id,))
    else:
        db.execute("UPDATE users SET role = 0 WHERE id=?", (user_id,))
    database.commit()
    return 0


""" Parsing the rss feed """


def get_podcast_details(url):
    rssFeed = feedparser.parse(url)
    # Get Feed details, add it as the first element of the answer list
    try:
        feedDetails = {
            #"name": rssFeed.feed.name,
            "podcast_name": rssFeed.feed.title,
            "author": rssFeed.feed.author,
            "website_url": rssFeed.feed.link,
            "rss_url": rssFeed.feed.links[0]["href"],
            "display_image": rssFeed.feed.image.url,
            "description": rssFeed.feed.description,
        }
    except AttributeError:
        return 1

    return feedDetails


def convert_date(date):
    time = datetime.datetime.strptime(date.split(".")[0], '%Y-%m-%d %H:%M:%S')
    if time.strftime("%Y") < datetime.datetime.today().strftime("%Y"):
        return time.strftime("%b, %d, %Y")
    else:
        return time.strftime("%b, %d")

def get_podcast_episodes(url):
    rssFeed = feedparser.parse(url)
    
    episodeList = []
    
    # Fill out the episode list with episodes
    for n in range(0, len(rssFeed.entries)):
        for i in range(0, len(rssFeed.entries[n]["links"])):
            if rssFeed.entries[n]["links"][i]["type"] == "audio/mpeg":
                audio_url = rssFeed.entries[n]["links"][i]["href"]
        episodeList.append(
            {
            "episode_title": rssFeed.entries[n]["title"],
            "publication_date": reformat_date(rssFeed.entries[n]["published"]),
            "description": Markup(rssFeed.entries[n]["description"]),
            "audio_url": audio_url,
            "duration": rssFeed.entries[n]["itunes_duration"]
            }
        )
    
    return episodeList

def get_podcasts_ids(database):
    db = database.cursor()
    db.execute("SELECT podcast_id, rss_url, podcast_name FROM podcasts")
    response = db.fetchall()
    return response

""" misc """
def reformat_date(str):
    date = str.split()
    # Swap month abbrev.for a number
    match date[2]:
        case "Jan":
            date[2] = "1"
        case "Feb":
            date[2] = "2"
        case "Mar":
            date[2] = "3"
        case "Apr":
            date[2] = "4"
        case "May":
            date[2] = "5"
        case "Jun":
            date[2] = "6"
        case "Jul":
            date[2] = "7"
        case "Aug":
            date[2] = "8"
        case "Sep":
            date[2] = "9"
        case "Oct":
            date[2] = "10"
        case "Nov":
            date[2] = "11"
        case "Dec":
            date[2] = "12"
        
    output = f"{date[3]}-{date[2]}-{date[1]} {date[4]}.000"
    return output
