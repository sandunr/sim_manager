var sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const DBSOURCE = "db.sqlite";

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    }else{
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(512) PRIMARY KEY NOT NULL,
            firstName VARCHAR(512) NULL DEFAULT '',
            lastName VARCHAR(512) NULL DEFAULT '',
            email VARCHAR(512) NOT NULL UNIQUE, 
            password VARCHAR(1024) NOT NULL,
            isAdmin INTEGER DEFAULT 0,
            CONSTRAINT email_unique UNIQUE (email)
            )`,
        (err) => {
            if (err) console.log(err);
            createUser();
        });

        db.run(`CREATE TABLE IF NOT EXISTS sims (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone VARCHAR(20) NULL DEFAULT '',
            owner VARCHAR(512) NULL DEFAULT '',
            email VARCHAR(512) NOT NULL UNIQUE,
            createDate VARCHAR(255) NULL,
            expireDate VARCHAR(255) NULL
            )`,
        (err) => {
            if (err) console.log(err);
        });
    }
});

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
  db.run(`INSERT OR IGNORE INTO users(id,firstName,lastName,email,password,isAdmin) VALUES(?,?,?,?,?,?)`,
      [user.id, user.firstName, user.lastName, user.email, user.password, user.isAdmin],
      (err) => {
          if (err) throw err;
      });
}

module.exports = db;