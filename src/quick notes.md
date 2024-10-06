Goal: make the game work offline

Approach:

The game sends inputs to the server and waits to receive the input back before moving. 

Connect the web sockets to send move inputs into themselves so that they don't rely on server communication. 

Observations:



Steps
- bypass the login menu
- bypass the server communication checks
- load the level locally
- bypass the input checks