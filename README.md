# Podcast Player
#### Video Demo: https://youtu.be/agHFtsYIiHc
#### Description:

> Note: Originally, this project was supposed to have more features than it has in its current state - unfortunately, I wasn't able to implement them all before the submission date. While it is functional, I'd still consider it unfinished and in somewhat "unpolished" state.

The project is a dynamic website built with Flask and SQLIte for the server side, and with a significant reliance on JavaSript for both pages functionality and server calls on the client end. Most of the page layout is created using the Bootstrap library.
The front-end consists of 5 subpages overall: the __Main__ page (acessible after logging in), __Login__ screen, __User Registration__ form, __User Settings__ page and an __Administrator Panel__.

##### Registering a new user and logging in.
The login and register functionalities are quite minimal - all that is required from the user is username and password - both of which need to be at least three characters long - the username needs to be shorter than 16 characters and not yet stored in the database. Additionally, when registering a new account, the user is required to repeat their password in a separate input field.
When all input fields are filled out correctly (a simple JavaScript function highlights the incorrectly filled out inputs), the username and a hashed password are stored in the _users_ table in the database. __"werkzeug.security"__ Python library is responsible for both generating and checking hashed passwords.

For the simplicity sake, the first registered user gets assigned an administrator role.

##### Administrator panel

Administrator have options to add new podcasts to the database, refreshing the stored episodes lists, changing other user's roles between regular users and administrator as well as removing other people's accounts from the database. They cannot change their own role, or delete their own account from that view (removing own account is done from the User's option menu)
The Server is set up to reresh the episode's data every 12 hours using the background scheduler from __"APScheduler"__ library, but at the current state the project is in, the manual updates from administrators are more reliable.
Currently, the only way to add a podcast to the database is copying its RSS link - one that directs straight to the __.xml__ file the Podcast data is stored in.

##### Main window - the Podcast Player

After the administrator adds the first podcast to the database, every registered user has the access to its episodes.
All podcasts are displayed in a scrollable list at the left hand side of the screen, and after selecting one of them, the wider column displays the podcast's name, author, cover image, and the list of episodes.
When an episode is selected, the user can expand its description (it's minimized to 256 characters to save the screen space), and see both when the episode was published,and its length.
Selecting either the play button below the episode description or one that's on every episode in the list scrolls the list of episodes/episode description column back to top, and starts the playback.
The playback options are rather minimal - they include volume control, a play/pause button, buttons to move the playback 15 seconds either forward an backward, and a progress bar showing how far into the episode the user is in, and doubling as a quick way to fast-forward/rewind through the audio.

##### User Settings

The settings available for all users consist of an option to change their password or remove their account from the database.
To set up a new password, user is required to enter the current password, and the new one twice in separate input fields.
To confirm removal of the account, user is required to enter their current password as well.