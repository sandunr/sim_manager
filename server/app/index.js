const path = require('path');
const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
var session = require('express-session');
var db = require('./db');
var sqlite3 = require('sqlite3').verbose();
var sqliteStoreFactory = require("express-session-sqlite").default;
const bcrypt = require('bcrypt');
const authenticationMiddleware = require('./middleware');

const SqliteStore = sqliteStoreFactory(session);

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    store: new SqliteStore({
        driver: sqlite3.Database,
        path: "db.sqlite",
        ttl: 300000
      }),
    cookie: {
        maxAge: 1000*60*60*24
    }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.authenticationMiddleware = authenticationMiddleware;
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    return done(null, user);
});

const verifyCallback = (email, password, done) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], function(error, result) {

        if (error) {
            return done(err);
        }
        
        if (!result) {        
            return done('Invalid email or password', false);
        }

        // Always use hashed passwords and fixed time comparison
        bcrypt.compare(password, result.password, (err, isValid) => {
            if (err) {
                return done(err);
            }
            if (!isValid) {
                return done(null, false);
            }
            const user = { id: result.id, email: result.email, firstName: result.firstName, lastName: result.lastName };
            return done(null, user);
        });
    });
}

passport.use(
    'login',
    new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, verifyCallback)
);

app.get("/logout", (req, res) => {
    req.logout(err => {
        if (err) return next(err);
        res.redirect('/login');
    })
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", 
    (req, res, next) => next(), 
    passport.authenticate('login', { 
        failureRedirect: '/login', 
        successRedirect: '/'
    })
);

app.all("*/*", authenticationMiddleware(), express.static(path.join(__dirname + "/public")));

app.set('view engine', 'ejs');
// app.use(authenticationMiddleware());
// app.use(express.static(path.join(__dirname + "/public")));

module.exports = app;