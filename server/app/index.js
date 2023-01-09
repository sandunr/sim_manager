const path = require('path');
const fs = require('fs');
const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
var session = require('express-session');
var connection = require('./mysql');
const bcrypt = require('bcrypt');
const authenticationMiddleware = require('./middleware');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { sendSMS } = require('./sms');

var MySQLStore = require('express-mysql-session')(session);
var sessionStore = new MySQLStore({}, connection);

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    store: sessionStore,
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
    connection.query('SELECT * FROM users WHERE email = ?', [email], function(error, result) {

        if (error) {
            return done(err);
        }
        
        if (!result || result.length === 0) {        
            return done('Invalid email or password', false);
        }

        // Always use hashed passwords and fixed time comparison
        bcrypt.compare(password, result[0].password, (err, isValid) => {
            if (err) {
                return done(err);
            }
            if (!isValid) {
                return done(null, false);
            }
            const user = { id: result[0].id, email: result[0].email, firstName: result[0].firstName, lastName: result[0].lastName };
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

app.post("/api/login", 
    (req, res, next) => next(), 
    passport.authenticate('login', { 
        failureRedirect: '/login', 
        successRedirect: '/'
    })
);

app.set('view engine', 'ejs');
app.all("*/*", authenticationMiddleware(), express.static(path.join(__dirname + "/public")));

app.get('/api/sims', (req, res) => {
    connection.query('SELECT * FROM sims', [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            success: true,
            data: rows
        });
    });
});

app.post('/api/sims', (req, res) => {
    const sim = req.body;
    if (!sim.phone) {
        res.status(200).json({ error: 'Phone number is required', success: false });
        return;
    }
    if (!sim.owner) {
        res.status(200).json({ error: 'Owner name is required', success: false });
        return;
    }
    const params = [sim.phone, sim.owner, sim.email, new Date().toString(), sim.expireDate];
    connection.query('INSERT INTO sims (phone,owner,email,createDate,expireDate) VALUES(?,?,?,?,?)', params, (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            success: true,
            data: rows
        });
    });
});

app.put('/api/sims/:simId', (req, res) => {
    if (!req.params || !req.params.simId) {
        res.status(400).json({ error: "Invalid sim" });
        return;
    }
    const sim = {
        owner: req.body?.owner,
        phone: req.body?.phone,
        email: req.body?.email,
        expireDate: req.body?.expireDate
    };
    if (sim.expireDate) {
        
    }
    connection.query(`UPDATE sims set 
                phone = COALESCE(?,phone), 
                email = COALESCE(?,email), 
                owner = COALESCE(?,owner), 
                expireDate = COALESCE(?,expireDate)  
                WHERE id = ?`, [
                    sim.phone,
                    sim.email,
                    sim.owner,
                    sim.expireDate,
                    req.params.simId
                ], (err, result) => {
        if (err) {
            res.status(200).json({ error: err });
            return;
        }
        res.json({
            success: true,
            data: sim,
            changes: this.changes
        })
    });
});

app.delete('/api/sims/:simId', (req, res) => {
    if (!req.params || !req.params.simId) {
        res.status(200).json({ error: "Invalid sim" });
        return;
    }
    connection.query(`DELETE FROM sims WHERE id = ?`, [ req.params.simId ], (err, result) => {
        if (err) {
            res.status(200).json({ error: err.code, success: false });
            return;
        }
        res.json({ success: true });
    });
});

app.get('/api/sims/csv', (req, res) => {
    connection.query('SELECT * FROM sims', [], (err, rows) => {
        if (err) {
            res.status(200).json({ error: err.message });
            return;
        }
        if (!rows || rows.length === 0) {
            res.status(200).json({ error: 'No sims found' });
            return;
        }
        const path = 'sims.csv';
        const csvWriter = createCsvWriter({
            path: path,
            header: [
            { id: 'phone', title: 'Phone Number' },
            { id: 'owner', title: 'Owner Name' },
            { id: 'email', title: 'Email' },
            { id: 'expireDate', title: 'Expire Date' },
            { id: 'createDate', title: 'Create Date' }
        ]
        });
        try {
            csvWriter.writeRecords(rows)
                .then(() => {
                    res.setHeader('Content-disposition', 'attachment; filename=sims.csv');
                    res.set('Content-Type', 'text/csv');
                    res.download(path, (err) => {
                        if (err) {
                            console.log(err);
                        }
                        fs.unlink(path, () => {
                            console.log('csv file deleted');
                        });
                    });
                });
        } catch (error) {
            console.log(error);
            res.send(200).json({ error: 'Oops! Something went wrong' });
        }
    });
});

app.get('/api/sendsms', (req, res) => {
    sendSMS();
    res.status(200).json();
});

module.exports = app;