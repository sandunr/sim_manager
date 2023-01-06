const fs = require("fs");
const sqlite = require("better-sqlite3");

function createDbConnection() {
    if (fs.existsSync(filepath)) {
        return new sqlite("sessions.db");
    } else {
        const db = new sqlite("sessions.db");
        createTable(db);
        console.log("Connection with SQLite has been established");
        return db;
    }
}

function createTable(db) {
    db.exec(`
    CREATE TABLE Users
    (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName   VARCHAR(512) NOT NULL,
      lastName   VARCHAR(512) NOT NULL,
      email   VARCHAR(512) NOT NULL,
      password VARCHAR(512) NOT NULL
    );
  `);
}

module.exports = createDbConnection();