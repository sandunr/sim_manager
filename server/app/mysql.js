const mysql = require('mysql');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const connection = mysql.createConnection({
    // host: 'host.docker.internal',
    host: '127.0.0.1',
    user: 'root',
    // password: 'Oreo@1006',
    password: 'Kandy#2004',
    database: 'simmanager',
    multipleStatements: true
});

connection.connect(err => {
    if (!err) {
        console.log('Connected to MySQL');
        connection.query(`CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(512) PRIMARY KEY NOT NULL,
            firstName VARCHAR(512) NULL DEFAULT '',
            lastName VARCHAR(512) NULL DEFAULT '',
            email VARCHAR(512) NOT NULL UNIQUE, 
            password VARCHAR(1024) NOT NULL,
            isAdmin INTEGER DEFAULT 0,
            CONSTRAINT email_unique UNIQUE (email)
            )`,
        (err) => {
            if (err) {
                console.log(err);
            } else {
                createUser();
            }
        });

        connection.query(`CREATE TABLE IF NOT EXISTS sims (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            phone VARCHAR(20) NULL DEFAULT '',
            owner VARCHAR(512) NULL DEFAULT '',
            email VARCHAR(512) NOT NULL UNIQUE,
            createDate VARCHAR(255) NULL,
            expireDate VARCHAR(255) NULL
            )`,
        (err) => {
            if (err) console.log(err);
        });
    } else {
        console.log(err);
        console.log('Connection failed to MySQL');
    }
});

module.exports = connection;

function createUser() {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);

    const user = {
        id: uuidv4(),
        firstName: 'Navi',
        lastName: 'Alaliya',
        email: 'navodya.alaliya93@gmail.com',
        password: bcrypt.hashSync('Oreo@1006', salt),
        isAdmin: true
    };
    connection.query(`INSERT IGNORE INTO users(id,firstName,lastName,email,password,isAdmin) VALUES(?,?,?,?,?,?)`,
        [user.id, user.firstName, user.lastName, user.email, user.password, user.isAdmin],
        (err) => {
            if (err) throw err;
        });
}