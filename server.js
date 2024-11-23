const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const port = 3000;

// Setup MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '04Prasanthi@', // Your MySQL password
    database: 'quiz_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database: ' + err.stack);
        return;
    }
    console.log('Connected to the database');
});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'quizsecret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport local strategy
passport.use(new LocalStrategy((username, password, done) => {
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) return done(err);
        if (results.length === 0) return done(null, false, { message: 'Incorrect username.' });

        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return done(err);
            if (isMatch) return done(null, user);
            else return done(null, false, { message: 'Incorrect password.' });
        });
    });
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
    db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
        done(err, results[0]);
    });
});

// User registration route
app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.send('Error hashing password');
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, results) => {
            if (err) return res.send('Error registering user');
            res.redirect('/login');
        });
    });
});

// User login route
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

// Logout route
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.send('Error logging out');
        res.redirect('/login');
    });
});

// Show quiz questions
app.get('/', (req, res) => {
    const category = req.query.category || 'General';
    db.query('SELECT * FROM questions WHERE category = ?', [category], (err, results) => {
        if (err) {
            console.error(err);
            return res.send('Error fetching questions');
        }
        res.render('index', { questions: results, user: req.user });
    });
});

// Post quiz submission
app.post('/submit', (req, res) => {
    const userAnswers = req.body;
    let score = 0;

    db.query('SELECT * FROM questions', (err, results) => {
        if (err) {
            console.error(err);
            return res.send('Error checking answers');
        }

        results.forEach((question) => {
            if (userAnswers[`question_${question.id}`] === question.correct_option) {
                score++;
            }
        });

        if (req.user) {
            db.query('INSERT INTO scores (user_id, score) VALUES (?, ?)', [req.user.id, score], (err) => {
                if (err) return res.send('Error saving score');
                res.render('result', { score, total: results.length });
            });
        } else {
            res.render('result', { score, total: results.length });
        }
    });
});

// Admin Panel - Add Question
app.get('/admin/add', (req, res) => {
    if (!req.user || req.user.username !== 'admin') {
        return res.redirect('/');
    }
    res.render('addQuestion');
});

app.post('/admin/add', (req, res) => {
    if (!req.user || req.user.username !== 'admin') {
        return res.redirect('/');
    }

    const { question, option_a, option_b, option_c, option_d, correct_option, category } = req.body;
    db.query('INSERT INTO questions (question, option_a, option_b, option_c, option_d, correct_option, category) VALUES (?, ?, ?, ?, ?, ?, ?)', [question, option_a, option_b, option_c, option_d, correct_option, category], (err) => {
        if (err) return res.send('Error adding question');
        res.redirect('/');
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
