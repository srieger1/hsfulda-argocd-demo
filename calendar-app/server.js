const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Define API routes first (before static files and catch-all route)
let db; // Define db at the top level so it's accessible to all routes

// API routes - define these BEFORE static files middleware
app.get('/api/events', (req, res) => {
  console.log('GET /api/events request received');
  if (!db) {
    console.error('Database connection not established');
    return res.status(500).send({ message: 'Database connection not established' });
  }
  
  db.query('SELECT * FROM events', (err, results) => {
    if (err) {
      console.error('Error fetching events:', err);
      return res.status(500).send({ message: 'Error fetching events', error: err });
    }
    console.log('Events fetched successfully:', results);
    res.status(200).json(results);
  });
});

app.post('/api/events', (req, res) => {
  console.log('POST /api/events request received with data:', req.body);
  if (!db) {
    console.error('Database connection not established');
    return res.status(500).send({ message: 'Database connection not established' });
  }
  
  const { name, date } = req.body;

  const query = 'INSERT INTO events (name, date) VALUES (?, ?)';
  db.query(query, [name, date], (err, result) => {
    if (err) {
      console.error('Error creating event:', err);
      return res.status(500).send({ message: 'Error creating event', error: err });
    }
    console.log('Event created successfully');
    res.status(201).send({
      message: 'Event created successfully!',
      event: { name, date }
    });
  });
});

app.delete('/api/events/:id', (req, res) => {
  console.log(`DELETE /api/events/${req.params.id} request received`);
  if (!db) {
    console.error('Database connection not established');
    return res.status(500).send({ message: 'Database connection not established' });
  }
  
  const eventId = req.params.id;

  const query = 'DELETE FROM events WHERE id = ?';
  db.query(query, [eventId], (err, result) => {
    if (err) {
      console.error('Error deleting event:', err);
      return res.status(500).send({ message: 'Error deleting event', error: err });
    }
    console.log('Event deleted successfully');
    res.status(200).send({ message: 'Event deleted successfully!' });
  });
});

// Serve static files AFTER defining API routes
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to serve the frontend for any non-API routes
// This must be defined LAST
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).send({ message: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Function to connect to database with retry
const connectWithRetry = () => {
  console.log('Attempting to connect to MySQL...');
  
  // Database connection
  const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'calendar_app'
  });

  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database: ', err);
      console.log('Will retry in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
      return;
    }
    
    console.log('Connected to the MySQL database');
    
    // Assign to the global db variable
    db = connection;
    
    // Create table if not exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date DATE NOT NULL
      )
    `;
    
    db.query(createTableQuery, (err) => {
      if (err) {
        console.error('Error creating table:', err);
      } else {
        console.log('Events table ready');
      }
    });
  });

  return connection;
};

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  
  // Wait 15 seconds before connecting to the database to ensure MySQL is fully initialized
  console.log('Waiting 15 seconds before connecting to the database...');
  setTimeout(() => {
    connectWithRetry();
  }, 15000);
}); 