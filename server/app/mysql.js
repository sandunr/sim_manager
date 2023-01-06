const sqlite = require("sqlite3");
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Kandy#2004',
    database: 'simmanager',
    multipleStatements: true
});

connection.connect(err => {
    if (!err) {
        console.log('Connected to MySQL');
    } else {
        console.log(err);
        console.log('Connection failed to MySQL');
    }
});

module.exports = connection;