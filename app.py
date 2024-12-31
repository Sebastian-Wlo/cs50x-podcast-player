from flask import Flask, request, render_template, jsonify, flash, redirect, session
from flask_session import Session
from functools import wraps
import os
import datetime

from werkzeug.security import check_password_hash, generate_password_hash


import sqlite3
import dbhelpers

# Store the last episode list update in a variable
last_update = "Undetermined"


# Database Update Scheduler imports
import time
import atexit
from apscheduler.schedulers.background import BackgroundScheduler


app = Flask(__name__)

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Connect to a database and create the cursor
database = sqlite3.connect("db/podcasts.db", check_same_thread=False)
database.row_factory = sqlite3.Row

""" 
Cache control function copied from the "CS50 Finance" project:
"""
@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


def login_check(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function

@app.route("/")
@login_check
def index():
    return render_template("index.html")


@app.route("/admin_panel")
@login_check
def admin_panel():
    if request.method == "GET":

        podcasts_list = dbhelpers.get_podcasts_list(database)
        return render_template("admin_panel.html", data=podcasts_list)

@app.route("/login", methods=["GET", "POST"])
def show_login_screen():
    session.clear()

    if request.method == "POST":

        username = request.form.get("username")
        password = request.form.get("password")
        userData = dbhelpers.find_user(username, database)
        if username != userData[1]:
            flash("Invalid Username", "error")
            return render_template("login.html")
        else:
            if len(password) == 0:
                flash("No password entered!", "error")
                return render_template("login.html")
            elif not check_password_hash(userData[3], password):
                flash("Invalid Username or Password!", "error")
                return render_template("login.html")
            
            session["user_id"] = userData[0]
            session["username"] = userData[1]
            session["role"] = userData[2]
            return redirect("/")  
    else:
        return render_template("login.html")


@app.route("/logout")
def log_out():
    #session.clear()
    return redirect("/login")

""" Routes used by JS """

@app.route("/register", methods=["GET", "POST"])
def register_page():
    if request.method == "POST":
        request_data = request.get_json()
        name = request_data["name"]
        password = request_data["password"]
        password_rpt = request_data["pswrd_rpt"]
        problems = 0
        response = {
            "username": "",
            "password": "",
            "repeat": ""
        }
        
        # If there are problems with the input data, return errors to the user
        if len(name) < 3 or len(name) > 16:
            response["username"] = "Username needs to be between 3 and 16 characters long!"
            problems += 1
        else:
            db_response = dbhelpers.find_user(name, database)
            if db_response != 0:
                problems += 1
                response["username"] = "Sorry! This username is taken."
        
        if len(password) < 3:
            response["password"] = "Password needs to be at least 3 characters long!"
            problems += 1
        
        if password_rpt != password:
            response["repeat"] = "Passwords don't match."
            problems += 1
        
        if problems == 0:
            userdata = [name, generate_password_hash(password), datetime.datetime.now()]
            dbhelpers.add_user(userdata, database)
            sessiondata = dbhelpers.find_user(name, database)
            session["user_id"] = sessiondata[0]
            session["username"] = sessiondata[1]
            session["role"] = sessiondata[2]

        return jsonify(response)
    
    else:    
        return render_template("register.html")

@app.route("/user_settings", methods=["GET"])
@login_check
def user_settings():
    return render_template("user_settings.html")

@app.route("/change_password", methods=["POST"])
@login_check
def change_password():
    if request.method == "POST":
        userData = dbhelpers.find_user(session["username"], database)
        request_data = request.get_json()
        old_password = request_data["old_password"]
        new_password = request_data["new_password"]
        repeat_password = request_data["repeat_password"]
        problems = 0
        response = {
            "old_password": "",
            "new_password": "",
            "repeat_password": ""
        }
        if not check_password_hash(userData[3], old_password):
            problems += 1
            response["old_password"] = "Old Password is incorrect!"
        if len(new_password) < 3:
            problems += 1
            response["new_password"] = "Password needs to be at least 3 characters long!"
        
        if repeat_password != new_password:
            response["repeat_password"] = "Passwords don't match."
            problems += 1
        
        if problems == 0:
            userdata = [session.get("user_id"), generate_password_hash(new_password)]
            dbhelpers.change_user_password(userdata, database)
            flash("Password successfully changed!", "success")
        
        return jsonify(response)
    
    else:    
        return render_template("user_settings.html")

@app.route("/delete_account", methods=["POST"])
@login_check
def delete_account():
    if request.method == "POST":
        userData = dbhelpers.find_user(session["username"], database)
        print("breakpoint")
        request_data = request.get_json()
        print(request_data)
        password = request_data["delete_password"]
        problems = 0
        response = {
            "delete_password": ""
        }
        if not check_password_hash(userData[3], password):
            problems += 1
            response["delete_password"] = "Password is incorrect!"
        if problems == 0:
            dbhelpers.remove_user(session["user_id"], database)
        print(response)
        return jsonify(response)
            
    return render_template("user_settings.html")

@app.route("/add_podcast", methods=["GET", "POST"])
def add_podcast():
    if request.method == "POST":
        link = request.form.get("rss_url")
        if link == "":
            flash("Empty Input field!", "error")
            return redirect("/admin_panel")
            
        rss_feed = request.form.get("rss_url")
        
        adding_successful = dbhelpers.add_new_podcast(rss_feed, database)
        if adding_successful == 0:
            flash("Podcast was successfully added to the list", "success")
        elif adding_successful == 1:
            flash("Podcast with that rss address is already on the list", "error")
    return redirect("/admin_panel")


@app.route("/get_podcast_list")
def get_podcast_list():
    data = dbhelpers.get_podcasts_list(database)
    return jsonify(data)

@app.route("/get_self")
def get_self():
    return jsonify(session["user_id"])

@app.route("/remove_podcast", methods=["POST"])
def remove_podcast():

    request_data = request.get_json()
    podcast_id = request_data["podcast_id"]
    dbhelpers.remove_podcast(podcast_id, database)
    return redirect("/admin_panel")


@app.route("/get_episodes/podcast_id/<int:podcast_id>")
def get_podcast_episodes(podcast_id):
    data = dbhelpers.get_episodes_list(database, podcast_id, True)
    for n in data:
        n["publication_date"] = convert_date(n["publication_date"])
    return jsonify(data)


@app.route("/update_episodes_db")
def update_episodes_db():
    updated = update()
    return render_template("admin_panel.html")

@app.route("/get_last_update")
def get_last_update():
    global last_update
    return jsonify(last_update)

@app.route("/get_user_list")
def get_user_list():
    data = dbhelpers.get_user_list(database)
    for n in data:
        n["registered"] = convert_date(n["registered"])
    return jsonify(data)

@app.route("/remove_user", methods=["POST"])
def remove_user():
    request_data = request.get_json()
    user_id = request_data["user_id"]
    dbhelpers.remove_user(user_id, database)
    return redirect("/admin_panel")

@app.route("/change_user_role", methods=["POST"])
def change_user_role():
    request_data = request.get_json()
    user_id = request_data["user_id"]
    dbhelpers.change_user_role(user_id, database)
    return redirect("/admin_panel")

def convert_date(date):
    time = datetime.datetime.strptime(date.split(".")[0], '%Y-%m-%d %H:%M:%S')
    if time.strftime("%Y") < datetime.datetime.today().strftime("%Y"):
        return time.strftime("%b, %d, %Y")
    else:
        return time.strftime("%b, %d")


def update():
    # Get list of podcasts
    list_of_podcasts = dbhelpers.get_podcasts_ids(database)
    # Continue only if there are any podcasts in the database
    if len(list_of_podcasts) > 0:
        for id in list_of_podcasts:
            # Get episodes lists for every podcast in the database
            episodes_in_database = dbhelpers.get_episodes_list(database, id[0])
            # Get episodes lists for every podcast in the url
            episodes_in_rss =  dbhelpers.get_podcast_episodes(id[1])
            # Prepare a list of episodes that will be added to the database 
            new_episodes = []
            # Count how many new episodes should be added
            marker = 0
            while episodes_in_database[len(episodes_in_database) - 1]["publication_date"].split(" ")[0] != episodes_in_rss[marker]["publication_date"].split(" ")[0]:
                new_episodes.insert(0, episodes_in_rss[marker])
                marker += 1
            dbhelpers.add_new_episodes(new_episodes, id[0], database)
            
    global last_update
    last_update = (str(datetime.datetime.now()).split(".")[0])
    return last_update
    
# Background scheduler setup
def schedule_updates():
    scheduler = BackgroundScheduler()
    scheduler.start()
    scheduler.add_job(func=update, trigger="interval", hours=12)
    

schedule_updates()

if __name__ == "__main__":
    atexit.register(lambda: scheduler.shutdown())
    try:
        app.run(debug=True, host='0.0.0.0')
    except KeyboardInterrupt:
        atexit.register(lambda: scheduler.shutdown())
    
''' When stopping the server, use command:'''
''' atexit.register(lambda: scheduler.shutdown()) '''