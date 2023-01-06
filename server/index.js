require('dotenv').config();
const app = require('./app');
const port = process.env.PORT || 8000;

// const SqliteStore = require("express-session-store")(session);
// const sessionsDB = new sqlite("sessions.db");

app.listen(port, function (err) {
    if (err) {
        throw err
    }
    console.log(`server is listening on ${port}...`)
});