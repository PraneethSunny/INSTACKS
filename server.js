const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();

// MySQL connection setup
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Your MySQL username
  password: '04Prasanthi@', // Your MySQL password
  database: 'myapp'
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL database');
});

// Middleware to parse incoming JSON data
app.use(bodyParser.json());

// Serve static HTML files (optional)
app.use(express.static('public'));

// GET route to retrieve all users
app.get('/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    res.json(results);
  });
});

// POST route to add a new user
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  const query = 'INSERT INTO users (name, email) VALUES (?, ?)';
  db.query(query, [name, email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to add user' });
    }
    res.status(201).json({ id: results.insertId, name, email });
  });
});

// PUT route to update a user
app.put('/users/:id', (req, res) => {
  const { name, email } = req.body;
  const query = 'UPDATE users SET name = ?, email = ? WHERE id = ?';
  db.query(query, [name, email, req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update user' });
    }
    res.json({ message: 'User updated' });
  });
});

// DELETE route to delete a user
app.delete('/users/:id', (req, res) => {
  const query = 'DELETE FROM users WHERE id = ?';
  db.query(query, [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }
    res.json({ message: 'User deleted' });
  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
